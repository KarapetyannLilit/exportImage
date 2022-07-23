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
      11: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
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
const tempfont = "./font-temp/temp1.ttf"
const tempfont1 = "./font-temp/temp.ttf"

const url = "https://static.essemem.com/fonts/sacramento-400.ttf"

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

async function calculateWidth(value, font, dataText, fontSize) {
  const letterSpacing = dataText.meta.letterSpacing
  const path = font.getPath(spaced(value, letterSpacing), 0, 0, fontSize)
  const pathSVG = path.toPathData()
  const constsymbol = Buffer.from(`
      <svg >
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

const fontFinder = async (string, font, boxWidth, dataText, fontSize) => {
  const strWidth = await calculateWidth(string, font, dataText, fontSize)
  const nextStrWidth = await calculateWidth(
    string,
    font,
    dataText,
    fontSize + 1
  )

  if (strWidth < boxWidth && nextStrWidth < boxWidth) {
    const newFontSize = fontSize + 1
    return await fontFinder(string, font, boxWidth, dataText, newFontSize)
  }
  if (strWidth <= boxWidth && nextStrWidth > boxWidth) {
    return fontSize
  }
  if (nextStrWidth === boxWidth) {
    return fontSize + 1
  }
}
const getLargestLength = (arrayOflengthOfLines) => {
  return arrayOflengthOfLines.reduce(function (accValue, curValue) {
    return Math.max(accValue, curValue)
  })
}

const createArrayOfFontSizes = async (dataText, font) => {
  let objectOflengthsAndLines = {}
  const objValues = Object.values(dataText.meta.value)
  let boxWidth
  if (dataText.width === "max-content") {
    boxWidth = dataText.maxWidth
  } else {
    boxWidth = dataText.width
  }

  const lines = await Promise.each(objValues, async (line) => {
    if (line.length === 0) {
      line = "<"
    }
    objectOflengthsAndLines[line.length] = line
    return line
  })

  const largestLength = await getLargestLength(
    Object.keys(objectOflengthsAndLines)
  )
  const largestLine = objectOflengthsAndLines[largestLength]
  const fontSIZE = await fontFinder(largestLine, font, boxWidth, dataText, 3)
  return fontSIZE
}

async function getFontSize(dataText, font) {
  const smallestFontSize = await createArrayOfFontSizes(dataText, font)
  return smallestFontSize
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

const createSvgText = async (objAlltextInTspan, font, dataText) => {
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
    if (line.length === 0) {
      line = "<enter>"
    }
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

async function exportText(dataText) {
  await writeFontToFile()
  const font = await opentype.load(tempfont1)
  dataText.meta.fontSize = await getFontSize(dataText, font)
  console.log(dataText.meta.fontSize)
  const changedTextObj = dataText.meta.value
  const textSvgBuffer = await createSvgText(changedTextObj, font, dataText)
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
