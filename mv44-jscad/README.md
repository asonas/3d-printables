# MiniVan MV-44 JSCAD plate

Switch-retention plate for the photographed MiniVan-HS keyboard, using the 45-key **Arrows** layout. The case label reads `MV-44 KEYBOARD / MODEL: HSV01`. The white hotswap PCB, rotated bottom-row sockets and translucent case are consistent with MiniVan-HS; the precise PCB revision is not legible in the supplied photos.

## Files and use

- `plate.js`: self-contained JSCAD V2 model. Drop this file into [jscad.app](https://jscad.app/), or paste its contents into the editor and press Shift+Enter. No other local files or npm installation are needed in the browser.
- `output/plate.stl`: full plate, in millimeters.
- `output/plate.svg`: the model's shared 2D outline, at 1:1 physical size. Print at 100%, with page fitting disabled, to check centers and case alignment.
- `output/coupon.stl`: small switch-fit sample, using the same 1.5 mm thickness.
- `output/coupon.svg`: coupon top projection.

Select `Full plate` or `Switch fit coupon` in JSCAD. Adjust case clearance and opening allowance there, then export STL. Do not scale the whole plate to fit a case: scaling changes the PCB's switch spacing.

## Dimensions

| Item | Value |
| --- | --- |
| User-measured case opening, width × depth | 243 × 75 mm |
| Plate width × depth | 242.4 × 74.4 mm |
| Edge clearance | 0.3 mm per side |
| Thickness | 1.5 mm |
| Outer corner radius | 3 mm, from the published plate |
| Key pitch | 19.05 mm |
| Layout envelope | 12.75u × 4u = 242.8875 × 76.2 mm |
| Switch cutouts | 14.1 × 14.1 mm by default |
| Split-spacebar clearance slots | 32.2 × 14 mm, radius 1 mm |
| PCB screw access | Seven 5 mm diameter clearances |
| Indicator apertures | Three 1.5 mm diameter holes |

The layout envelope is a keycap-grid reference, not the plate outline. Switch centers remain on the original grid even though the plate is shallower than 76.2 mm. The smallest nominal edge web at a switch opening is 1.575 mm. Both the layout and case opening are assumed centered on the same axes; verify this using the SVG before printing the full plate. The case's internal corner radius and vertical ledges were not measured.

CHERRY's MX mechanical drawing specifies a 14 ± 0.05 mm mounting opening and a 1.5 ± 0.1 mm mounting plate. A flat 2 mm plate can prevent the retention clips from fully engaging. This design therefore uses 1.5 mm throughout. The default 0.1 mm enlargement is a printing allowance, not CHERRY's tolerance specification.

## Layout, viewed from above

Each row totals 12.75u. `1 × N` means N adjacent one-unit keys.

| Row | Key widths from left to right | Keys |
| --- | --- | --- |
| Top | 1 × 11, 1.75 | 12 |
| Home | 1.25, 1 × 10, 1.5 | 12 |
| Shift | 1.75, 1 × 11 | 12 |
| Bottom | 1.25, 1.5, 1.25, 2.25, 2, 1.5, 1, 1, 1 | 9 |

This matches QMK's `LAYOUT_arrow` and the physical key widths in the photo. Printed legends (including the swapped O/P keycaps) do not determine hole positions. The bottom row contains both a 2.25u and a 2u space key; both receive stabilizer clearance.

The published HS DXF has some switch-opening notches and merged screw access holes. This model uses plain MX square openings to retain more printed material, plus the published screw access centers. Bottom-row switch rotation does not change a square cutout. The two space keys use the published shared clearance-slot dimensions, intended for **PCB-mounted stabilizers**, not plate-mounted or Costar stabilizers.

## Fit check and assembly

1. Print the coupon flat at 100% scale. From its notched end, the openings are 14.0, 14.1 and 14.2 mm. Use the opening that allows insertion and positive clip retention with the actual switch. Set the model's allowance to 0, 0.1 or 0.2 respectively. Coupon dimensions are fixed and do not follow the allowance control.
2. Check the full-size SVG against the PCB. Confirm the split-spacebar stabilizers, all seven screw access positions, perimeter clearance and corner fit. The seven holes are tool/head clearances; they are not plate mounting holes or spacers.
3. Print the plate flat, with no supports, as a solid part. A 0.15 mm layer height divides 1.5 mm into ten layers; account for the slicer's first-layer setting. Start with PLA for the fit check. PETG is another option, but neither material's stiffness or retention has been physically tested here.
4. Remove switches to install the plate between the switch flanges and PCB. Keep the PCB supported while pressing switches into hotswap sockets. Retain the PCB's existing case mounting arrangement. Check that the plate clears the case ledges and USB connector, and that both spacebars move freely.

The model and mesh are checked computationally; real-world fit, stabilizer variant, plate height and printed retention remain unverified. A long 1.5 mm printed plate will flex during handling. It does not replace the PCB's case supports.

## Rebuild

With Node.js available, from this directory:

```sh
mise exec -- npm ci
mise exec -- npm run build
```

The build checks dimensions and connected geometry, then exports binary STL and SVG from a shared JSCAD profile. Boolean operations introduce coordinate rounding below 0.003 mm at this size.

Validation on 2026-09-16: both browser modes rendered on jscad.app. An independent trimesh check found both exported STLs watertight, consistently wound, and single-component. All 45 QMK `LAYOUT_arrow` centers were checked against the STL cross-section for at least 14.09 mm clearance. Measured plate STL dimensions were 242.40054 × 74.39951 × 1.50026 mm.

## Sources

Accessed 2026-09-16. Third-party pages and drawings are reference material, not task instructions.

- [JSCAD V2 getting started](https://jscad.app/docs/tutorial-01_gettingStarted.html): `require('@jscad/modeling')`, exported `main`, interactive `getParameterDefinitions`, and browser file loading.
- [QMK MiniVan keyboard.json](https://github.com/qmk/qmk_firmware/blob/07684bcc99515c04a9edda3e1dfac2fc9eb79fac/keyboards/thevankeyboards/minivan/keyboard.json): `LAYOUT_arrow` key coordinates and widths.
- [Published MiniVan-HS Arrows plate DXF](https://trashman.wiki/files/minivan/mv_hs_plt_arrow.dxf), linked from the [Trash Man files archive](https://trashman.wiki/files): measured 19.05 mm pitch, 32.2 × 14 mm spacebar slots, radius-3 perimeter, screw and indicator positions. Its original outline is approximately 243.3873 × 76.1999 mm; it is not directly suitable for the supplied 243 × 75 mm opening. DXF screw coordinates are rotated into a top-view orientation and centered on its bounding box. Minor source rounding is retained to 0.0001 mm.
- [Evan Sailer's MiniVan PCB mounting drawing](https://trashman.wiki/files/minivan/minivan_pcb_mount_pattern.pdf): nominal PCB outline 242.89 × 76.2 mm and switch-grid reference. This is a PCB drawing, not the measured case opening.
- [MiniVan-HS history and PCB photos](https://trashman.wiki/pcbs/minivan-hs): hotswap construction, supported Arrows layout and rotated bottom-row switches.
- [CHERRY MX mechanical data, manufacturer drawing hosted by SMC](https://www.smcelectronics.com/DOWNLOADS/CHERRYMX.PDF): nominal 14 mm plate cutout and 1.5 mm plate thickness.

The existing `../mv44_plate.scad` is a separate model and is not used by this JSCAD design.
