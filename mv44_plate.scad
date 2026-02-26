// MV-44 (MiniVan) Keyboard Plate
// THEVAN MV-44 Standard Layout (12.75u, 44 keys)
// For Cherry MX compatible switches
// Optimized for 3D printing

// ========================================
// Parameters
// ========================================

// Key unit (standard keyboard spacing)
unit = 19.05;  // 1u = 19.05mm

// Switch hole dimensions (3D print adjusted)
switch_hole_size = 14.2;  // 14mm + 0.2mm tolerance

// Plate thickness
plate_thickness = 2.0;  // Thicker for 3D print strength

// Plate margin (around the keys)
plate_margin = 5;  // mm from edge of outermost keys

// Stabilizer dimensions (Cherry style, 3D print adjusted)
stab_hole_width = 7.0;   // 6.75mm + tolerance
stab_hole_length = 14.0; // ~14mm for wire clearance
stab_spacing_2u = 11.938;    // Distance from switch center to stab center (2u)
stab_spacing_225u = 11.938;  // Same spacing for 2.25u

// Layout dimensions
layout_width_u = 12.75;  // Total width in units
layout_rows = 4;         // Number of rows

// Calculated dimensions
plate_width = layout_width_u * unit + plate_margin * 2;
plate_height = layout_rows * unit + plate_margin * 2;

// Display settings
show_debug_grid = false;  // Show unit grid for debugging

// ========================================
// Row layouts (key sizes in units)
// ========================================

// Row 1: Tab + 10 alpha + Backspace
row1_keys = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75];

// Row 2: Fn + 10 alpha + Enter
row2_keys = [1.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5];

// Row 3: Shift + 10 alpha + Shift
row3_keys = [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

// Row 4: Ctrl + Fn + Alt + Space(2.25) + Space(2) + Alt + Fn + Ctrl
row4_keys = [1.25, 1.5, 1.25, 2.25, 2, 1.25, 1.5, 1.75];

// Keys that need stabilizers (size >= 2u)
row4_stab_indices = [3];  // Index 3 = 2.25u spacebar

// ========================================
// Modules
// ========================================

// Single switch hole
module switch_hole() {
    cube([switch_hole_size, switch_hole_size, plate_thickness + 2], center = true);
}

// Stabilizer cutout for a given key size
// size: key size in units (2, 2.25, etc.)
module stabilizer_cutout(size) {
    // Calculate stabilizer spacing based on key size
    spacing = (size == 2) ? stab_spacing_2u : stab_spacing_225u;

    // Left stabilizer hole
    translate([-spacing, 0, 0])
        cube([stab_hole_width, stab_hole_length, plate_thickness + 2], center = true);

    // Right stabilizer hole
    translate([spacing, 0, 0])
        cube([stab_hole_width, stab_hole_length, plate_thickness + 2], center = true);
}

// Place a key at position (x_offset in units, row number 0-3)
// key_size: width of key in units
// with_stab: add stabilizer cutout
module place_key(x_offset, row, key_size, with_stab = false) {
    // Calculate center position
    // x_offset is the left edge of the key in units
    // Add half the key size to get center
    x_pos = plate_margin + (x_offset + key_size / 2) * unit;
    y_pos = plate_margin + (layout_rows - 1 - row + 0.5) * unit;  // Row 0 at top

    translate([x_pos, y_pos, plate_thickness / 2]) {
        switch_hole();
        if (with_stab && key_size >= 2) {
            stabilizer_cutout(key_size);
        }
    }
}

// Place a row of keys
// keys: array of key sizes
// row: row number (0-3, 0 = top)
// stab_indices: array of indices that need stabilizers
module place_row(keys, row, stab_indices = []) {
    x_offset = 0;
    for (i = [0 : len(keys) - 1]) {
        has_stab = len(search(i, stab_indices)) > 0;
        place_key(x_offset, row, keys[i], has_stab);
        x_offset = x_offset + keys[i];
    }
}

// All switch holes and stabilizer cutouts
module all_cutouts() {
    // Row 1 (top)
    place_row(row1_keys, 0);

    // Row 2
    place_row(row2_keys, 1);

    // Row 3
    place_row(row3_keys, 2);

    // Row 4 (bottom) with stabilizers
    place_row(row4_keys, 3, row4_stab_indices);
}

// Plate outline
module plate_outline() {
    cube([plate_width, plate_height, plate_thickness]);
}

// Complete plate
module mv44_plate() {
    difference() {
        plate_outline();
        all_cutouts();
    }
}

// Debug: show unit grid
module debug_grid() {
    if (show_debug_grid) {
        for (x = [0 : layout_width_u]) {
            translate([plate_margin + x * unit, 0, plate_thickness])
                %cube([0.5, plate_height, 1]);
        }
        for (y = [0 : layout_rows]) {
            translate([0, plate_margin + y * unit, plate_thickness])
                %cube([plate_width, 0.5, 1]);
        }
    }
}

// ========================================
// Render
// ========================================

mv44_plate();
debug_grid();

// ========================================
// Debug info
// ========================================

echo("=== MV-44 Plate Dimensions ===");
echo(str("Plate width: ", plate_width, " mm"));
echo(str("Plate height: ", plate_height, " mm"));
echo(str("Plate thickness: ", plate_thickness, " mm"));
echo(str("Total keys: ", len(row1_keys) + len(row2_keys) + len(row3_keys) + len(row4_keys)));
