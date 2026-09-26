const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { geometries, measurements, booleans, primitives } = require('@jscad/modeling')
const stl = require('@jscad/stl-serializer')
const { main } = require('./holder')

const solid = main()
geometries.geom3.validate(solid)
assert.equal(booleans.scission(solid).length, 1, 'Holder must be one connected solid')
const dimensions = measurements.measureDimensions(solid)
dimensions.forEach((value, i) => assert.ok(Math.abs(value - [116, 90, 50][i]) < 0.001))
// Independent rectangular-prism calculation checks the closed band and raised back.
assert.ok(Math.abs(measurements.measureVolume(solid) - 23120) < 1)
const openingProbe = primitives.cuboid({ size: [111.98, 85.98, 52], center: [0, 45, 25] })
assert.ok(Math.abs(measurements.measureVolume(booleans.intersect(solid, openingProbe))) < 1e-6)

const output = path.join(__dirname, 'output')
fs.mkdirSync(output, { recursive: true })
fs.writeFileSync(path.join(output, 'tissue-holder.stl'), Buffer.concat(stl.serialize({ binary: true }, solid).map(b => Buffer.from(b))))

const project = ([x, y, z]) => [360 + 3 * x - 1.6 * y, 280 + 1.05 * x + 1.2 * y - 2.4 * z]
const faces = geometries.geom3.toPolygons(solid).map(p => ({
  vertices: p.vertices,
  depth: p.vertices.reduce((sum, [x, y, z]) => sum + x + y + z, 0) / p.vertices.length,
})).sort((a, b) => a.depth - b.depth)
const mesh = faces.map(({ vertices }) => {
  const [a, b, c] = vertices
  const u = b.map((v, i) => v - a[i]), v = c.map((v, i) => v - a[i])
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const shade = Math.round(185 + 50 * Math.abs(n[2]) / Math.hypot(...n))
  return `<polygon points="${vertices.map(v => project(v).join(',')).join(' ')}" fill="rgb(${shade - 25},${shade},${shade + 10})" stroke="#46616a" stroke-width="0.6"/>`
}).join('\n')
fs.writeFileSync(path.join(output, 'preview.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="650" viewBox="0 0 760 650">
<rect width="760" height="650" fill="#fafaf7"/>
<g font-family="sans-serif" fill="#243b43">
<text x="30" y="38" font-size="24">Tissue case wall holder</text>
<text x="30" y="66" font-size="16">Closed rectangular band / dimensions in mm</text>
${mesh}
<text x="30" y="465" font-size="18">Outer: 116 W × 90 D · Opening: 112 W × 86 D</text>
<text x="30" y="498" font-size="18">Band: 20 H · Wall plate: 50 H · Thickness: 2</text>
<text x="30" y="542" font-size="16">Wall contact: back of the tall plate</text>
<text x="30" y="572" font-size="16">Print: flat band bottom on bed (Z = 0)</text>
<text x="30" y="610" font-size="16">Physical fit and tape adhesion require verification.</text>
</g></svg>`)
console.log(`Verified: ${dimensions.map(n => +n.toFixed(3)).join(' × ')} mm; one solid; opening 112 × 86 mm; volume 23120 mm³`)
