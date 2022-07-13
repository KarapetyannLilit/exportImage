const sharp = require("sharp")
const font2base64 = require("node-font2base64")
let font_base64 = ""
let font = ""
const opentype = require("opentype.js")
const { spaced } = require("letter-spacing")
const dst = process.argv[2]
let heightSVG = 500,
  widthSVG = 500,
  height = 330, //288
  width = 356, //135
  text = "Click  asrdrt fgyhkutktyutyrtryeyt iu4r7y5e47y uijopiuytrdfc", //
  fontFamily = "sans-serif", //
  fontSize = 66, //
  backgroundColor = "#D9E7E9", //
  color = "red", //
  lineHeight = 1,
  letterSpacing = 0, //
  shadow = "", //?
  horizontalAlign = "start" //???
const value = spaced(text, letterSpacing)

Promise.each = function (arr, fn) {
  return arr.reduce((prev, cur) => {
    return prev.then(() => fn(cur))
  }, Promise.resolve())
}

function getMetadataWidth(src, letter, widthofConst, quantity) {
  return sharp(src)
    .metadata()
    .then((data) => data.width)
    .then((widthtext) => {
      measurWidth(widthtext, width, letter, widthofConst, quantity)
    })
    .catch(console.log)
}

let objAlltextInTspan = {}

const tspamCreate = (a, letter, quantity) => {
  if (a < width && quantity > 0) {
    if (objAlltextInTspan[quantity]) {
      objAlltextInTspan[quantity]["text"].push(letter)
    } else {
      objAlltextInTspan[quantity] = {
        text: [letter],
      }
    }
  } else {
    let lastKey = parseInt(Object.keys(objAlltextInTspan)[0])
    if (a < width * (quantity - lastKey + 1) && objAlltextInTspan[lastKey]) {
      objAlltextInTspan[lastKey]["text"].push(letter)
    } else {
      lastKey--
      objAlltextInTspan[lastKey] = {
        text: [letter],
      }
    }
  }
}
let a = 0

const measurWidth = (widthletter, width, letter, widthofConst, quantity) => {
  if (letter === " ") {
    widthletter -= widthofConst
  }
  a += widthletter
  tspamCreate(a, letter, quantity)
}

const getText = (value, widthofConst, quantity) => {
  const arrayofletter = value.split("")

  return Promise.each(arrayofletter, (letter) => {
    const path = font.getPath(letter, 0, 0, fontSize)
    const pathSVG = path.toPathData()
    const changeForSpace = font.getPath("! !", 0, 0, fontSize)
    const pathchangeForSpace = changeForSpace.toPathData()
    const letterinSvg = Buffer.from(`
      <svg >
      <style>
      .title {fill:${color}; font-size:${fontSize}px;   
      letter-spacing:${letterSpacing}; font-weight:bold; text-anchor:${horizontalAlign};font-family:"alex-brush";}
      </style> 
        <path class="title" d="${
          letter === " " ? pathchangeForSpace : pathSVG
        }"/>   
      </svg>
  `)
    return getMetadataWidth(letterinSvg, letter, widthofConst, quantity)
  })
}

async function constsymbolWIdth(value, font) {
  const path = font.getPath(value, 0, 0, fontSize)
  const pathSVG = path.toPathData()
  const constsymbol = Buffer.from(`
      <svg >
      <style>
      .title {fill:${color};  font-size:${fontSize}px; stroke:
      letter-spacing:${letterSpacing}; font-weight:bold; text-anchor:${horizontalAlign};font-family:alex-brush;}
      </style>
        <path class="title" d="${pathSVG}"/>   
      </svg>
      `)
  return getSymbolWidth(constsymbol, "!!")
}

async function constAllWIdth(value, font) {
  const path = font.getPath(value, 0, 0, fontSize)
  const pathSVG = path.toPathData()
  const constsymbol = Buffer.from(`
    <svg >
     <style>
      .title {fill:${color}; font-size:${fontSize}px;
      letter-spacing:${letterSpacing}; font-weight:bold; text-anchor:${horizontalAlign};font-family:alex-brush;}
      </style>
        <path class="title" d="${pathSVG}"/>   
        </svg>`)
  return getSymbolWidth(constsymbol, value)
}

const getSymbolWidth = (src, letter) => {
  return sharp(src)
    .metadata()
    .then((data) => data.width)
    .then((widthletter) => widthletter)
    .catch(console.log)
}
let x = 5,
  y = fontSize

const createSvgText = (objAlltextInTspan, path) => {
  const objValues = Object.keys(objAlltextInTspan)
  let tsapns = ""

  for (let i = objValues.length - 1; i >= 0; i--) {
    const path = font.getPath(
      objAlltextInTspan[objValues[i]].text.join(""),
      x,
      y,
      fontSize
    )
    const pathSVG = path.toPathData()
    tsapns += `<path class="title" d="${pathSVG}"/>   `
    y += fontSize
  }
  const text = Buffer.from(`
       <svg width="${widthSVG}" height="${heightSVG}" fill="${backgroundColor}" >
      <style>
      .title {fill:${color}; font-size:${fontSize}px;
      letter-spacing:${letterSpacing}; font-weight:bold; text-anchor:${horizontalAlign};width=${width};font-family:alex-brush;stroke="black"}
      </style>
          <rect   width="${width}" fill="${backgroundColor}" height="${height}" />
          ${tsapns}
    </svg>
      `)
  saveWithSharp(text, path)
}

const saveWithSharp = (text, path) => {
  const newText = sharp(text).png().resize(30, 200).png()
  console.log(newText.options.input.buffer)
  sharp("Image.jpg")
  .resize(700,500)
    .composite([
      // {
      //   input: newText.options.input.buffer,
      //   top: 100,
      //   left: 50,
      // },
      {
        input: text,
        top: 100,
        left: 250,
      },
    ])
    .jpeg({
      quality: 100,
      chromaSubsampling: "4:4:4",
      mozjpeg: true,
    })
    .toFile(dst)
    .then((data) => {
      console.log(data)
    })
    .catch((err) => {
      console.log(err)
    })
}

async function callsymbols(src) {
  font = await opentype.load("./alex-brush-v20-latin-regular.woff")
  const widthofConst = await constsymbolWIdth("!!", font)
  const widthofText = await constAllWIdth(value, font)
  const path = font.getPath(value, 50, 50, 24)
  const pathSVG = path.toPathData()
  const quantity = Math.ceil(widthofText / width)
  await getText(value, widthofConst, quantity)
  createSvgText(objAlltextInTspan, pathSVG)
}

callsymbols(value)
