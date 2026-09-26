const fs = require('node:fs')
const path = require('node:path')
const { measurements, geometries } = require('@jscad/modeling')
const stl = require('@jscad/stl-serializer')
const { cap } = require('./cover')

const output = path.join(__dirname, 'output')
fs.mkdirSync(output, { recursive: true })
async function build () {
  const solid = await cap()
  geometries.geom3.validate(solid)
  const size = measurements.measureDimensions(solid)
  const expected = [26.4, 25, 16]
  size.forEach((value, i) => {
    if (Math.abs(value - expected[i]) > 0.02) throw new Error(`Unexpected dimension ${value}`)
  })
  if (measurements.measureVolume(solid) <= 0) throw new Error('Cap volume must be positive')
  const chunks = stl.serialize({ binary: true }, solid)
  fs.writeFileSync(path.join(output, 'switch-cover-v2-photo-prototype.stl'),
    Buffer.concat(chunks.map(chunk => Buffer.from(chunk))))
  console.log(`Photo prototype: ${size.map(value => value.toFixed(2)).join(' x ')} mm including hooks`)
}

build().catch(error => { console.error(error); process.exitCode = 1 })
