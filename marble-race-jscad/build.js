const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { geometries, measurements, booleans } = require('@jscad/modeling')
const stl = require('@jscad/stl-serializer')
const { main, spec, kinds, sample, floorPoints } = require('./race')

const output = path.join(__dirname, 'output')
fs.mkdirSync(output, { recursive: true })
const report = {}
for (const part of [...kinds, 'gate']) {
  const solid = main({ part })
  geometries.geom3.validate(solid)
  const dimensions = measurements.measureDimensions(solid)
  dimensions.forEach((v, i) => assert.ok(v <= [220, 200, 250][i], `${part} exceeds the build volume`))
  assert.equal(booleans.scission(solid).length, 1, `${part} must be connected`)
  assert.ok(measurements.measureVolume(solid) > 0)
  fs.writeFileSync(path.join(output, `${part}.stl`),
    Buffer.concat(stl.serialize({ binary: true }, solid).map(b => Buffer.from(b))))
  report[part] = { dimensions: dimensions.map(n => +n.toFixed(3)) }
  console.log(`${part}: ${report[part].dimensions.join(' x ')} mm; connected`)
}

for (const kind of kinds) {
  const first = sample(kind, 0)
  const last = sample(kind, 1)
  assert.ok(Math.abs(first.x - spec.startX) < 1e-9 && Math.abs(first.z - spec.startZ) < 1e-9)
  assert.ok(Math.abs(last.x - first.x - spec.run) < 1e-9 && Math.abs(first.z - last.z - spec.drop) < 1e-9)
  const floor = floorPoints(kind)
  floor.forEach((p, i) => {
    assert.ok(p[1] >= spec.base)
    if (i) assert.ok(p[0] > floor[i - 1][0], `${kind}: non-monotonic surface`)
  })
  // The withdrawn gate must leave the running surface intact.
  for (let i = 1; i < floor.length; i++) {
    const a = floor[i - 1], b = floor[i]
    if (a[0] <= spec.gateX && b[0] >= spec.gateX) {
      const z = a[1] + (b[1] - a[1]) * (spec.gateX - a[0]) / (b[0] - a[0])
      assert.ok(z + 3 < spec.gateBottom, `${kind}: gate slot intersects the running surface`)
    }
  }
}

const inks = ['#2193ba', '#d18022', '#9465ba']
const project = ([x, y, z]) => [90 + 3.1 * x + 1.55 * y, 480 + 0.5 * x - 0.8 * y - 2.2 * z]
const faces = main().flatMap((solid, i) => geometries.geom3.toPolygons(solid).map(p => ({
  vertices: p.vertices, ink: inks[i],
  depth: p.vertices.reduce((sum, [x, y, z]) => sum + x - 2 * y + z * 0.3, 0) / p.vertices.length,
}))).sort((a, b) => a.depth - b.depth)
const mesh = faces.map(p => {
  const [a, b, c] = p.vertices
  const u = b.map((v, i) => v - a[i]), v = c.map((v, i) => v - a[i])
  const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const light = 0.72 + 0.25 * Math.abs(normal[2]) / Math.hypot(...normal)
  const ink = '#' + p.ink.slice(1).match(/../g).map(s => Math.round(parseInt(s, 16) * light).toString(16).padStart(2, '0')).join('')
  return `<polygon points="${p.vertices.map(v => project(v).map(n => n.toFixed(2)).join(',')).join(' ')}" fill="${ink}" stroke="${ink}" stroke-width="0.3"/>`
}).join('\n')
const curves = kinds.map((kind, i) => {
  const points = Array.from({ length: 241 }, (_, j) => {
    const p = sample(kind, j / 240)
    return `${90 + (p.x - spec.startX) * 3.4},${715 + (spec.startZ - p.z) * 2.4}`
  }).join(' ')
  return `<polyline points="${points}" fill="none" stroke="${inks[i]}" stroke-width="3"/>`
}).join('\n')
fs.writeFileSync(path.join(output, 'preview.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="1040" viewBox="0 0 980 1040">
<rect width="980" height="1040" fill="#f7f7f2"/>
<g font-family="sans-serif" fill="#17303c"><text x="40" y="45" font-size="28">Marble race / 16 mm marbles</text>
<text x="40" y="76" font-size="17">Each track: 196 x 26 x up to 130 mm · print upright · gate: separate part</text>
${mesh}
<text x="40" y="640" font-size="19">Blue: cycloid / Orange: straight / Purple: circular arc</text>
<text x="40" y="680" font-size="19">Marble center paths · run 141.37 mm / drop 90 mm</text>
${curves}
<text x="90" y="705" font-size="16">START</text><text x="575" y="948" font-size="16">FINISH</text>
<text x="40" y="1000" font-size="16">Prototype: physical rolling, release and catch behavior require a print trial.</text></g></svg>`)
fs.writeFileSync(path.join(output, 'dimensions.json'), JSON.stringify(report, null, 2) + '\n')
console.log('Shared endpoints, surface ordering, gate clearance and build volume verified.')
