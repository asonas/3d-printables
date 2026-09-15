const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { geometries, measurements, booleans } = require('@jscad/modeling')
const stl = require('@jscad/stl-serializer')
const svg = require('@jscad/svg-serializer')
const { main, createProfile } = require('./plate')

const output = path.join(__dirname, 'output')
fs.mkdirSync(output, { recursive: true })
for (const part of ['plate', 'coupon']) {
  const solid = main({ part })
  geometries.geom3.validate(solid)
  const dimensions = measurements.measureDimensions(solid)
  const expected = part === 'plate' ? [242.4, 74.4, 1.5] : [65, 23, 1.5]
  // JSCAD boolean operations quantize coordinates to an extent-based epsilon.
  dimensions.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 0.003, `Unexpected dimension ${value}`))
  assert.equal(booleans.scission(solid).length, 1, 'The printed part must stay connected.')
  const binary = stl.serialize({ binary: true }, solid)
  fs.writeFileSync(path.join(output, `${part}.stl`), Buffer.concat(binary.map(chunk => Buffer.from(chunk))))
  const top = createProfile({ part })
  fs.writeFileSync(path.join(output, `${part}.svg`), svg.serialize({ unit: 'mm' }, top).join(''))
  console.log(`${part}: ${dimensions.map(n => n.toFixed(3)).join(' x ')} mm; one connected solid`)
}
