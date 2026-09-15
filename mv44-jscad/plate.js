// MiniVan-HS Arrows plate. All dimensions are millimeters.
// Sources and fit assumptions: README.md in this directory.
const { booleans, extrusions, modifiers, primitives, transforms } = require('@jscad/modeling')
const { subtract } = booleans
const { rectangle, roundedRectangle, circle } = primitives
const { translate } = transforms

const PITCH = 19.05
const ROWS = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75],
  [1.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1.25, 1.5, 1.25, 2.25, 2, 1.5, 1, 1, 1]
]

// Diameter-5 access clearances from mv_hs_plt_arrow.dxf, centered and rotated.
const SCREWS = [
  [-91.5936, -15.7], [-90.0436, 19.05], [-44.6936, -27.25],
  [-13.8436, 19.05], [16.6436, -0.05], [60.8936, -27.45],
  [89.1936, 21.35]
]

const getParameterDefinitions = () => [
  { name: 'part', type: 'choice', values: ['plate', 'coupon'], captions: ['Full plate', 'Switch fit coupon'], initial: 'plate', caption: 'Part' },
  { name: 'clearance', type: 'float', initial: 0.3, min: 0.1, max: 0.6, step: 0.1, caption: 'Case clearance per side (mm)' },
  { name: 'allowance', type: 'float', initial: 0.1, min: 0, max: 0.3, step: 0.05, caption: 'Switch opening allowance, total (mm)' }
]

const createProfile = (params = {}) => {
  const p = { part: 'plate', clearance: 0.3, allowance: 0.1, ...params }
  if (!Number.isFinite(p.clearance) || p.clearance < 0.1 || p.clearance > 0.6) {
    throw new Error('Case clearance must be between 0.1 and 0.6 mm per side.')
  }
  if (!Number.isFinite(p.allowance) || p.allowance < 0 || p.allowance > 0.3) {
    throw new Error('Switch opening allowance must be between 0 and 0.3 mm.')
  }
  if (!['plate', 'coupon'].includes(p.part)) throw new Error('Unknown part.')

  if (p.part === 'coupon') {
    // The clipped upper-left corner identifies the 14.0 mm end.
    const body = subtract(
      rectangle({ size: [65, 23] }),
      translate([-32.5, 11.5], circle({ radius: 3, segments: 32 })),
      ...[14, 14.1, 14.2].map((size, i) =>
        translate([(i - 1) * 21, 0], rectangle({ size: [size, size] })))
    )
    return body
  }

  const holes = []
  ROWS.forEach((row, rowIndex) => {
    let left = 0
    row.forEach(width => {
      const center = [(left + width / 2 - 12.75 / 2) * PITCH, (1.5 - rowIndex) * PITCH]
      const opening = 14 + p.allowance
      holes.push(translate(center, rectangle({ size: [opening, opening] })))
      if (width >= 2) {
        // The published HS plate clears PCB-mounted stabilizers with a shared slot.
        holes.push(translate(center, roundedRectangle({ size: [32.2, 14], roundRadius: 1, segments: 32 })))
      }
      left += width
    })
  })
  holes.push(...SCREWS.map(center => translate(center, circle({ radius: 2.5, segments: 48 }))))
  // Three indicator light paths between the first four top-row switches.
  holes.push(...[1, 2, 3].map(x => translate([(x - 6.375) * PITCH, 1.5 * PITCH], circle({ radius: 0.75, segments: 24 }))))
  const outline = roundedRectangle({ size: [243 - 2 * p.clearance, 75 - 2 * p.clearance], roundRadius: 3, segments: 48 })
  return subtract(outline, holes)
}

// Split T-junctions before serialization so every mesh edge has two faces.
const main = (params) => modifiers.generalize({ triangulate: true }, extrusions.extrudeLinear({ height: 1.5 }, createProfile(params)))

module.exports = { main, getParameterDefinitions, createProfile }
