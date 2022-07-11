const sharp = require("sharp")

const dst = process.argv[2]
let heightSVG = 500,
  widthSVG = 500,
  height = 24, //
  width = 130, //
  value =
    "Click aaaaaaaaabbbbbbbbbbbbbbbbbaaaaaaaaa asrdrtfgyhkutktyutyrtryeyt iu4r7y5e47y uijopiuytrdfc", //
  fontFamily = "Sans-serif", //
  fontSize = 24, //
  backgroundColor = "#D9E7E9", //
  color = "red", //
  lineHeight = 1,
  letterSpacing = 0, //
  shadow = "", //?
  horizontalAlign = "left" //???
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
    const letterinSvg = Buffer.from(`
      <svg><text x="50%" y="50%" fill="${color}">${
      letter === " " ? "! !" : letter
    }</text></svg>
  `)
    return getMetadataWidth(letterinSvg, letter, widthofConst, quantity)
  })
}

async function constsymbolWIdth(value) {
  const constsymbol = Buffer.from(`
      <svg><text x="50%" y="50%" fill="${color}">${value}</text></svg>
      `)
  return getSymbolWidth(constsymbol, "!!")
}

async function constAllWIdth(value) {
  const constsymbol = Buffer.from(`
  <svg><text x="50%" y="50%" fill="${color}">${value}</text></svg>`)
  return getSymbolWidth(constsymbol, value)
}

const getSymbolWidth = (src, letter) => {
  return sharp(src)
    .metadata()
    .then((data) => data.width)
    .then((widthletter) => widthletter)
    .catch(console.log)
}

const createSvgText = (objAlltextInTspan) => {
  const objValues = Object.keys(objAlltextInTspan)
  let tsapns = ""
  for (let i = objValues.length - 1; i >= 0; i--) {
    tsapns += `<tspan  x="0" dy="1.2em">${objAlltextInTspan[
      objValues[i]
    ].text.join("")}</tspan> `
  }
  const constsymbol = Buffer.from(`
       <svg width="${widthSVG}" height="${heightSVG}">
      <style>
      .title {fill:${color}; font-family:${fontFamily}; font-size:${fontSize}px;
      letter-spacing:${letterSpacing}; font-weight:bold }
      </style>
          <text x="50" y="50"  class="title">${tsapns}</text>
    </svg>
      `)
  saveWithSharp(constsymbol)
}

const saveWithSharp = (constsymbol) => {
  sharp("Image.jpg")
    .composite([
      {
        input: constsymbol,
        top: 50,
        left: 50,
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
  let alltextWidth = []
  const widthofConst = await constsymbolWIdth("!!")
  const widthofText = await constAllWIdth(value)
  const quantity = Math.ceil(widthofText / width)
  await getText(value, widthofConst, quantity)
  createSvgText(objAlltextInTspan)
}

callsymbols(value)
