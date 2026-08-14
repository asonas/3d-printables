output_mode = "adapter";
extension_length = 15;
body_diameter = 19;
bore_diameter = 10;
thread_nominal_diameter = 14;
thread_pitch = 1;
male_thread_length = 10;
female_thread_depth = 10;
thread_clearance = 0.25;
chamfer = 0.6;
grip_count = 24;
grip_depth = 0.5;
cutter_overshoot = 0.2;
thread_height = 0.55;
thread_flat = 0.18;
gauge_thread_length = 5;
gauge_grip_height = 3;
female_gauge_height = 8;
$fn = 96;

assert(extension_length >= female_thread_depth,
       "extension_length must contain the female thread");
assert(body_diameter > thread_nominal_diameter,
       "body_diameter must exceed the thread diameter");
assert(bore_diameter < thread_nominal_diameter - 2 * thread_pitch,
       "bore leaves insufficient thread depth");

module adapter_body() {
    difference() {
        cylinder(h = extension_length, d = body_diameter);
        translate([0, 0, -0.01])
            cylinder(h = extension_length + 0.02, d = bore_diameter);
    }
}

module left_hand_thread_ridge(
    major_diameter,
    pitch,
    length,
    clearance = 0,
    internal = false
) {
    radial_offset = internal ? clearance : -clearance;
    root_radius = major_diameter / 2 - thread_height + radial_offset;
    crest_radius = major_diameter / 2 + radial_offset;
    slices_per_turn = 24;

    linear_extrude(
        height = length,
        twist = -360 * length / pitch,
        slices = ceil(length / pitch * slices_per_turn),
        convexity = 10
    )
        polygon([
            [root_radius, -pitch / 2 + thread_flat / 2],
            [crest_radius, -thread_flat / 2],
            [crest_radius, thread_flat / 2],
            [root_radius, pitch / 2 - thread_flat / 2]
        ]);
}

module male_thread(length = male_thread_length) {
    male_root_radius = thread_nominal_diameter / 2
        - thread_height - thread_clearance;

    union() {
        cylinder(h = length, r = male_root_radius);
        left_hand_thread_ridge(
            thread_nominal_diameter,
            thread_pitch,
            length,
            thread_clearance,
            false
        );
    }
}

module female_thread_cutter(length = female_thread_depth) {
    female_root_radius = thread_nominal_diameter / 2
        - thread_height + thread_clearance;

    union() {
        translate([0, 0, -0.01])
            cylinder(h = length + 0.02, r = female_root_radius);
        left_hand_thread_ridge(
            thread_nominal_diameter,
            thread_pitch,
            length,
            thread_clearance,
            true
        );
        translate([0, 0, -0.01])
            cylinder(
                h = chamfer + 0.01,
                d1 = thread_nominal_diameter + 2 * thread_clearance + 2 * chamfer,
                d2 = 2 * female_root_radius
            );
    }
}

module grip_cutters() {
    cutter_width = body_diameter * sin(180 / grip_count) * 0.55;

    for (angle = [0 : 360 / grip_count : 360 - 360 / grip_count]) {
        rotate([0, 0, angle])
            translate([
                body_diameter / 2 + (cutter_overshoot - grip_depth) / 2,
                0,
                extension_length / 2
            ])
                cube(
                    [
                        grip_depth + cutter_overshoot,
                        cutter_width,
                        extension_length + 0.02
                    ],
                    center = true
                );
    }
}

module barrel_extension() {
    difference() {
        union() {
            cylinder(h = extension_length, d = body_diameter);
            translate([0, 0, extension_length])
                male_thread();
        }

        translate([0, 0, -0.01])
            female_thread_cutter();
        translate([0, 0, -0.02])
            cylinder(
                h = extension_length + male_thread_length + 0.04,
                d = bore_diameter
            );
        grip_cutters();
        translate([0, 0, extension_length + male_thread_length - chamfer])
            cylinder(
                h = chamfer + 0.01,
                d1 = bore_diameter,
                d2 = bore_diameter + 2 * chamfer
            );
    }
}

module male_thread_gauge() {
    difference() {
        union() {
            cylinder(h = gauge_grip_height, d = body_diameter);
            translate([0, 0, gauge_grip_height - 0.01])
                male_thread(gauge_thread_length + 0.01);
        }

        translate([0, 0, -0.01])
            cylinder(
                h = gauge_grip_height + gauge_thread_length + 0.02,
                d = bore_diameter
            );
    }
}

module female_thread_gauge() {
    difference() {
        cylinder(h = female_gauge_height, d = body_diameter);
        female_thread_cutter(gauge_thread_length);
        translate([0, 0, -0.01])
            cylinder(h = female_gauge_height + 0.02, d = bore_diameter);
    }
}

if (output_mode == "adapter") {
    barrel_extension();
} else if (output_mode == "male_gauge") {
    male_thread_gauge();
} else if (output_mode == "female_gauge") {
    female_thread_gauge();
} else {
    assert(false, str("unknown output_mode: ", output_mode));
}
