const { convert } = require("convert-svg-to-png")
const sharp = require("sharp")

const src = process.argv[2]
const dst = process.argv[3]

const addWithSharp = (src, dst) => {
  const label = Buffer.from(`
    <svg viewBox="0 0 200 200" width="200" height="200" >
  <style>
    polygon { fill: white }

    div {
      color: black;
      font:18px serif;
      height: 100%;
      overflow: auto;
    }
  </style>

//   <polygon points="5,5 195,10 185,185 10,195" />

  <foreignObject x="20" y="20" width="160" height="160">
    <div xmlns="http://www.w3.org/1999/xhtml">
    - Смолчал хозяин, да и то, что мог сказать
    - Мне невдомёк, но во владениях чертога
    Поможет дом срубить да судьбы вам связать.
    Не веришь ежли - испроси у Бога...
    </div>
  </foreignObject>
</svg>
    `)

    // const pngSvg =
      convert(label).then(console.log)

  sharp(src)
    .composite([
      {
        input: label,
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

addWithSharp(src, dst)
