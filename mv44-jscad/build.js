const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { geometries, measurements, booleans } = require('@jscad/modeling')
const stl = require('@jscad/stl-serializer')
const svg = require('@jscad/svg-serializer')
const { main, createProfile } = require('./plate')

const output = path.join(__dirname, 'output')
fs.mkdirSync(output, { recursive: true })
for (const part of ['plate', 'plate-left', 'plate-right', 'coupon']) {
  const solid = main({ part })
  geometries.geom3.validate(solid)
  const dimensions = measurements.measureDimensions(solid)
  const expected = part === 'coupon' ? [65, 23, 1.5]
    : part === 'plate' ? [242.4, 74.4, 1.5] : [128.34375, 74.4, 1.5]
  // JSCAD boolean operations quantize coordinates to an extent-based epsilon.
  dimensions.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 0.003, `Unexpected dimension ${value}`))
  assert.equal(booleans.scission(solid).length, 1, 'The printed part must stay connected.')
  const binary = stl.serialize({ binary: true }, solid)
  fs.writeFileSync(path.join(output, `${part}.stl`), Buffer.concat(binary.map(chunk => Buffer.from(chunk))))
  const top = createProfile({ part })
  fs.writeFileSync(path.join(output, `${part}.svg`), svg.serialize({ unit: 'mm' }, top).join(''))
  console.log(`${part}: ${dimensions.map(n => n.toFixed(3)).join(' x ')} mm; one connected solid`)
}

const plate = createProfile()
const left = createProfile({ part: 'plate-left' })
const right = createProfile({ part: 'plate-right' })
const joined = booleans.union(left, right)
assert.ok(measurements.measureArea(booleans.intersect(left, right)) < 0.01, 'Halves must not overlap.')
// Repeated booleans shift long cutout edges by the coordinate-rounding epsilon.
const areaTolerance = 0.5 // mm², less than 0.006% of the plate material area
assert.ok(measurements.measureArea(booleans.subtract(plate, joined)) < areaTolerance, 'The split must preserve the full plate.')
assert.ok(measurements.measureArea(booleans.subtract(joined, plate)) < areaTolerance, 'The split must not add material.')
console.log('Split halves reconstruct the full plate without overlap.')
