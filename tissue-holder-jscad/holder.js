const { primitives, booleans, modifiers } = require('@jscad/modeling')

const defaults = { width: 116, depth: 90, bandHeight: 20, backHeight: 50, thickness: 2 }

function getParameterDefinitions() {
  return [
    { name: 'width', type: 'float', initial: defaults.width, caption: '外寸 幅 (mm)' },
    { name: 'depth', type: 'float', initial: defaults.depth, caption: '外寸 奥行き (mm)' },
    { name: 'bandHeight', type: 'float', initial: defaults.bandHeight, caption: '枠の高さ (mm)' },
    { name: 'backHeight', type: 'float', initial: defaults.backHeight, caption: '背板の高さ (mm)' },
    { name: 'thickness', type: 'float', initial: defaults.thickness, caption: '板厚 (mm)' },
  ]
}

function main(params = {}) {
  const p = { ...defaults, ...params }
  for (const name of Object.keys(defaults)) {
    if (!Number.isFinite(p[name]) || p[name] <= 0) throw new Error(`${name} must be positive`)
  }
  const { width, depth, bandHeight, backHeight, thickness } = p
  if (2 * thickness >= Math.min(width, depth)) throw new Error('板厚が大きすぎます')
  if (backHeight < bandHeight) throw new Error('背板の高さは枠の高さ以上にしてください')

  // Y=0 is the wall contact face; Z=0 is the print bed and the bottom of the band.
  const outer = primitives.cuboid({ size: [width, depth, bandHeight], center: [0, depth / 2, bandHeight / 2] })
  const opening = primitives.cuboid({
    size: [width - 2 * thickness, depth - 2 * thickness, bandHeight + 2],
    center: [0, depth / 2, bandHeight / 2],
  })
  const back = primitives.cuboid({ size: [width, thickness, backHeight], center: [0, thickness / 2, backHeight / 2] })
  return modifiers.generalize({ triangulate: true }, booleans.union(booleans.subtract(outer, opening), back))
}

module.exports = { main, getParameterDefinitions, defaults }
