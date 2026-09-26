const { geometries } = require('@jscad/modeling')

// Photo-derived prototype dimensions; the latch and actuator dimensions need a fit check.
const defaultDimensions = {
  diameter: 25,
  faceThickness: 1.8,
  wall: 1.2,
  skirtHeight: 10.5,
  totalHeight: 16,
  hookWidth: 3,
  hookProjection: 0.7,
  actuatorHeight: 6.5,
  actuatorSpan: 3.6,
  ribThickness: 0.8
}

async function cap (dimensions = {}) {
  const { default: Module } = await import('manifold-3d')
  const kernel = await Module()
  kernel.setup()
  const { Manifold, CrossSection } = kernel
  const d = { ...defaultDimensions, ...dimensions }
  const radius = d.diameter / 2
  const block = (size, center) => Manifold.cube(size, true).translate(center)
  const profile = new CrossSection([[
    [0, 0], [radius - 0.5, 0], [radius, 0.5],
    [radius, d.skirtHeight], [radius - d.wall, d.skirtHeight],
    [radius - d.wall, d.faceThickness], [0, d.faceThickness]
  ]])
  let shell = profile.revolve(128)
  const windows = [
    { width: 12, y: -radius, bottom: 5 },
    { width: 5, y: radius, bottom: 4.5 }
  ]
  for (const { width, y, bottom } of windows) {
    shell = shell.subtract(block([width, 7, d.totalHeight], [0, y, bottom + d.totalHeight / 2]))
  }

  const parts = [shell]
  for (const angle of [0, 180]) {
    const arm = block(
      [d.wall, d.hookWidth, d.totalHeight - d.skirtHeight + 0.5],
      [radius - d.wall / 2 - 0.12, 0, (d.totalHeight + d.skirtHeight - 0.5) / 2])
    const hook = new CrossSection([[
      [radius - d.wall - 0.12, d.totalHeight - 1.8],
      [radius + d.hookProjection, d.totalHeight - 1.8],
      [radius + d.hookProjection, d.totalHeight - 1.2],
      [radius - 0.12, d.totalHeight],
      [radius - d.wall - 0.12, d.totalHeight]
    ]]).extrude(d.hookWidth).rotate([90, 0, 0]).translate([0, d.hookWidth / 2, 0])
    parts.push(arm.rotate([0, 0, angle]), hook.rotate([0, 0, angle]))
  }

  // Four separate contact tips leave the switch's central opening unobstructed.
  const tipThickness = 0.8
  const tipCenter = (d.actuatorSpan - tipThickness) / 2
  const ribStart = tipCenter - tipThickness / 2
  const ribEnd = radius - d.wall + 0.2
  for (const angle of [0, 90, 180, 270]) {
    const ribHeight = 3.2
    const rib = block([ribEnd - ribStart, d.ribThickness, ribHeight],
      [(ribStart + ribEnd) / 2, 0, d.faceThickness + ribHeight / 2 - 0.15])
    const tip = block([tipThickness, 1.5, d.actuatorHeight - d.faceThickness + 0.2],
      [tipCenter, 0, (d.actuatorHeight + d.faceThickness - 0.2) / 2])
    parts.push(rib.rotate([0, 0, angle]), tip.rotate([0, 0, angle]))
  }
  const solid = Manifold.union(parts).simplify(0.005)
  if (solid.status() !== 'NoError') throw new Error(`Invalid solid: ${solid.status()}`)
  if (solid.decompose().length !== 1) throw new Error('Cap must be one connected solid')
  const mesh = solid.getMesh()
  const polygons = []
  for (let i = 0; i < mesh.triVerts.length; i += 3) {
    const points = Array.from(mesh.triVerts.slice(i, i + 3), index =>
      Array.from(mesh.vertProperties.slice(index * mesh.numProp, index * mesh.numProp + 3)))
    polygons.push(geometries.poly3.create(points))
  }
  solid.delete()
  profile.delete()
  return geometries.geom3.create(polygons)
}

module.exports = { main: cap, cap, defaultDimensions }
