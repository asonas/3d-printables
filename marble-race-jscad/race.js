const { primitives, transforms, colors } = require('@jscad/modeling')
const { cuboid, polyhedron } = primitives
const { translate } = transforms

const spec = Object.freeze({
  marbleDiameter: 16, run: Math.PI * 45, drop: 90,
  startX: 16, startZ: 110, length: 196,
  width: 26, channel: 20, wall: 3, pitch: 30,
  base: 3, catchFloor: 5, samples: 240,
  gateX: 24, gateBottom: 102, gateThickness: 2, gateHeight: 30,
})
const kinds = ['cycloid', 'straight', 'circle']
const palette = [[0.13, 0.58, 0.73], [0.93, 0.55, 0.18], [0.58, 0.4, 0.73]]

function box(x, y, z, dx, dy, dz) {
  return cuboid({ size: [dx, dy, dz], center: [x + dx / 2, y + dy / 2, z + dz / 2] })
}

function sample(kind, u) {
  const { run, drop, startX, startZ } = spec
  if (kind === 'cycloid') {
    const t = Math.PI * u
    return { x: startX + drop / 2 * (t - Math.sin(t)),
      z: startZ - drop / 2 * (1 - Math.cos(t)), nx: Math.cos(t / 2), nz: Math.sin(t / 2) }
  }
  if (kind === 'straight') {
    const length = Math.hypot(run, drop)
    return { x: startX + run * u, z: startZ - drop * u, nx: drop / length, nz: run / length }
  }
  if (kind === 'circle') {
    const radius = (run * run + drop * drop) / (2 * drop)
    const angle = Math.asin(run / radius) * (1 - u)
    return { x: startX + run - radius * Math.sin(angle),
      z: startZ - drop + radius * (1 - Math.cos(angle)), nx: Math.sin(angle), nz: Math.cos(angle) }
  }
  throw new Error(`Unknown track: ${kind}`)
}

function floorPoints(kind) {
  const points = Array.from({ length: spec.samples + 1 }, (_, i) => {
    const p = sample(kind, i / spec.samples)
    // Offset the contact surface so the 16 mm sphere's center follows the named curve.
    return [p.x - spec.marbleDiameter / 2 * p.nx, p.z - spec.marbleDiameter / 2 * p.nz]
  })
  const last = points.at(-1)
  const endX = kind === 'straight'
    ? last[0] + (last[1] - spec.catchFloor) * spec.run / spec.drop
    : last[0] + 14
  // The catch transition is beyond the shared center-coordinate finish line.
  points.push([endX, spec.catchFloor], [192, spec.catchFloor], [193, 25], [spec.length, 25])
  return [[0, points[0][1]], ...points]
}

function track(kind) {
  const floor = floorPoints(kind)
  const slotStart = spec.gateX - 0.25
  const slotEnd = spec.gateX + 2.25
  const finish = spec.startX + spec.run
  const xs = [...new Set([...floor.map(p => p[0]), slotStart - 0.05, slotStart,
    slotEnd, slotEnd + 0.05, finish - 0.45, finish - 0.4, finish + 0.4, finish + 0.45])].sort((a, b) => a - b)
  const points = xs.flatMap(x => {
    let i = 1
    while (i < floor.length - 1 && floor[i][0] < x) i++
    const a = floor[i - 1], b = floor[i]
    const z = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])
    let top = z + 20
    if (x >= slotStart && x <= slotEnd) top = Math.min(top, spec.gateBottom)
    if (Math.abs(x - finish) <= 0.400001) top -= 0.8
    return [[x, 0, 0], [x, 26, 0], [x, 26, top], [x, 23, top],
      [x, 23, z], [x, 3, z], [x, 3, top], [x, 0, top]]
  })
  // Shared cross-section vertices avoid T-junctions along the finely sampled curves.
  const faces = []
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < 8; j++) {
      const a = i * 8 + j, b = i * 8 + (j + 1) % 8
      faces.push([a, b, b + 8], [a, b + 8, a + 8])
    }
  }
  const cap = [[0, 1, 4], [0, 4, 5], [1, 2, 3], [1, 3, 4], [0, 5, 6], [0, 6, 7]]
  faces.push(...cap.map(f => f.slice().reverse()))
  faces.push(...cap.map(f => f.map(v => v + (xs.length - 1) * 8)))
  return polyhedron({ points, faces, orientation: 'outward' })
}

function gate() {
  return box(0, 0, 0, 92, spec.gateHeight, spec.gateThickness)
}

function main({ part = 'assembly' } = {}) {
  if (kinds.includes(part)) return track(part)
  if (part === 'gate') return gate()
  if (part !== 'assembly') throw new Error(`Unknown part: ${part}`)
  return kinds.map((kind, i) => colors.colorize(palette[i], translate([0, spec.pitch * i, 0], track(kind))))
}

function getParameterDefinitions() {
  return [{ name: 'part', type: 'choice', values: ['assembly', ...kinds, 'gate'],
    captions: ['3 tracks (gate removed)', 'Cycloid', 'Straight', 'Circular arc', 'Start gate (print flat)'],
    initial: 'assembly', caption: 'Part' }]
}

module.exports = { main, getParameterDefinitions, spec, kinds, sample, floorPoints, palette }
