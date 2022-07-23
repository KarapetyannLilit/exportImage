const sharp = require("sharp")
let font = ""
const opentype = require("opentype.js")
const { spaced } = require("letter-spacing")
const request = require("request-promise")
const fs = require("fs")
const font2base64 = require("node-font2base64")
const dst = process.argv[2]
const dataText = {
  coords: {
    x: 163, //
    y: 45, //
  },
  dimentionLocked: false,
  height: 360, //
  id: 61472,
  layerType: "OrdinaryLayer",
  maxWidth: 452, //
  meta: {
    backgroundColor: "yellow", // +
    color: "red", //+
    fontFamily: "Sacramento", //+
    fontId: "805",
    fontSize: 24, // +
    highlightColor: "#FFFFFF", // der chka
    horizontalAlign: "center", // +
    letterSpacing: 0, // +
    lineHeight: 1, // +
    shadow: "", // der chka
    value: {
      0: "aaaaaaaaaaa",
      1: "",
      2: ":joy:, :smiley:, :man_in_lotus_position::skin-tone-2:, :earth_africa:, :partly_sunny_rain:",
      3: "jnhjhjh",
      4: "a",
      5: "aaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      6: "",
      7: "bbbbbbbbbbbbbbbbbbbbbbbbbbb",
      8: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      9: "hhhhhhhhh",
      10: "",
      11: "",
      12: "h",
    },
  },
  order: 1,
  placeholder: "",
  rotation: 0,
  title: "aaaaaaaa...",
  type: "TEXT_LAYER",
  width: 452,
}
Promise.each = function (arr, fn) {
  return arr.reduce((prev, cur) => {
    return prev.then(() => fn(cur))
  }, Promise.resolve())
}
const tempfont1 = "./font-temp/temp.ttf"

const url = "https://static.essemem.com/fonts/abril-fatface-400.ttf"

const getFontBuffer = async () => {
  return await request(
    {
      url: url,
      encoding: null,
    },
    (err, resp) => {
      if (!err && resp.statusCode === 200) {
        return resp.body
      }
      return null
    }
  )
}

const writeFontToFile = async () => {
  const buffer = await getFontBuffer()
  fs.writeFile(tempfont1, buffer, (err) => {
    if (err) {
      console.error(err)
    }
  })
}

async function calculateWidth(value, font, dataText) {
  const letterSpacing = dataText.meta.letterSpacing
  const fontSize = dataText.meta.fontSize
  const lineHeight = dataText.meta.lineHeight
  const color = dataText.meta.color
  const path = font.getPath(spaced(value, letterSpacing), 0, 0, fontSize)
  const pathSVG = path.toPathData()
  const constsymbol = Buffer.from(`
      <svg >
      <style>
      .title {fill:${color};}
      </style>
        <path class="title" d="${pathSVG}"/>
      </svg>
      `)
  return await getSymbolWidth(constsymbol)
}
const getSymbolWidth = (src) => {
  return sharp(src)
    .metadata()
    .then((data) => data.width)
    .then((widthletter) => widthletter)
    .catch(console.log)
}

const findXforHorizontalAlign = (horizontalAlign, widthOfSVG, widthOfPath) => {
  switch (horizontalAlign) {
    case "left":
      return 0
    case "center":
      return (widthOfSVG - widthOfPath) / 2
    case "right":
      return widthOfSVG - widthOfPath
  }
}

const createSvgText = async (
  objAlltextInTspan,
  font,
  dataText,
) => {
  const letterSpacing = dataText.meta.letterSpacing
  const fontSize = dataText.meta.fontSize
  const lineHeight = dataText.meta.lineHeight
  const color = dataText.meta.color
  const backgroundColor = dataText.meta.backgroundColor
  const heightOfSVG = dataText.height
  const horizontalAlign = dataText.meta.horizontalAlign
  let widthOfSVG

  if (dataText.width === "max-content") {
    widthOfSVG = dataText.maxWidth
  } else {
    widthOfSVG = dataText.width
  }
  const objValues = Object.values(objAlltextInTspan)
  let tsapns = ""

  const textInSvgCoords = {
    x: 0,
    y: dataText.meta.fontSize / 2,
  }

  const paths = await Promise.each(objValues, async (line) => {
    const path = font.getPath(
      spaced(line, letterSpacing),
      textInSvgCoords.x,
      textInSvgCoords.y,
      fontSize
    )
    const pathSVG = path.toPathData()

    if (line === "<enter>") {
      tsapns += `<path  fill-opacity="0"  d="${pathSVG}"/>   `
    } else {
      const widthOfPath = await getSymbolWidth(
        Buffer.from(`<svg><path d="${pathSVG}"/></svg>`)
      )
      const newX = await findXforHorizontalAlign(
        horizontalAlign,
        widthOfSVG,
        widthOfPath
      )
      const xForTransform = newX - textInSvgCoords.x
      tsapns += `<path transform ="translate(${xForTransform})" class="title" d="${pathSVG}"/>   `
    }
    textInSvgCoords.y += fontSize * lineHeight
    return tsapns
  })

  return Buffer.from(`
    <svg  viewBox="0 0 ${widthOfSVG} ${heightOfSVG}" >
      <style>
      .title {fill:${color}; }
      </style>
        <rect class="rect" width="100%" height="100%" fill="${backgroundColor}"/>
        ${paths}
    </svg>
    `)
}

const linebreaker = async (string, end, font, boxWidth, arr, dataText) => {
  if (end === 0) {
    return arr
  }
  const workingString = string.substr(0, end)
  const strWidth = await calculateWidth(workingString, font, dataText)
  if (strWidth < boxWidth) {
    arr.push(workingString)
    const tail = string.substr(end).trim()
    return await linebreaker(tail, tail.length, font, boxWidth, arr, dataText)
  }
  if (workingString.includes(" ")) {
    end = workingString.lastIndexOf(" ")
  } else {
    end = Math.floor(end / (strWidth / boxWidth))
  }
  return await linebreaker(string, end, font, boxWidth, arr, dataText)
}

async function createChangedObject(dataText) {
  const font = await opentype.load(tempfont1)
  let boxWidth

  if (dataText.width === "max-content") {
    boxWidth = dataText.maxWidth
  } else {
    boxWidth = dataText.width
  }
  let arr = []
  const newObj = await Object.values(dataText.meta.value).reduce(
    async (acc, line) => {
      let { newTextObj, index } = await acc
      let lineChunks
      if (line.length === 0) {
        line = "<enter>"
        lineChunks = [line]
      }
      lineChunks = await linebreaker(
        line,
        line.length,
        font,
        boxWidth,
        arr,
        dataText
      )
      const fitsInLine = lineChunks.length === 1
      if (fitsInLine) {
        newTextObj[index] = line
        index++
      } else {
        lineChunks.forEach((chunk) => {
          index++
          newTextObj[index] = chunk
        })
      }
      return {
        newTextObj,
        index,
        lineChunks,
      }
    },
    {
      newTextObj: {},
      index: 0,
      lineChunks: [],
    }
  )
  const arrayOfChangedText = newObj.lineChunks
  const changedTextObj = Object.assign({}, arrayOfChangedText)
  return changedTextObj
}
async function exportText(dataText) {
  await writeFontToFile()
  const font = await opentype.load(tempfont1)
  const changedTextObj = await createChangedObject(dataText)
  const textSvgBuffer = await createSvgText(
    changedTextObj,
    font,
    dataText,
  )
  return textSvgBuffer
}
const svgTextBufferToPng = async (dataText) => {
  const buffer = await exportText(dataText)
  sharp(buffer)
    .png()
    .toFile(dst)
    .then((data) => {
      console.log(data)
    })
    .catch((err) => {
      console.log(err)
    })
}
svgTextBufferToPng(dataText)
