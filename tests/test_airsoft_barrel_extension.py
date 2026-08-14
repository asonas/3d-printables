from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "airsoft_barrel_extension.scad"


class AirsoftBarrelExtensionContractTest(unittest.TestCase):
    def setUp(self):
        self.source = MODEL.read_text(encoding="utf-8")

    def value(self, name):
        match = re.search(rf"^{name}\s*=\s*([^;]+);", self.source, re.MULTILINE)
        self.assertIsNotNone(match, f"missing parameter: {name}")
        return match.group(1).strip().strip('"')

    def test_default_dimensions(self):
        self.assertEqual(self.value("output_mode"), "adapter")
        self.assertEqual(float(self.value("extension_length")), 15.0)
        self.assertEqual(float(self.value("body_diameter")), 19.0)
        self.assertEqual(float(self.value("bore_diameter")), 10.0)
        self.assertEqual(float(self.value("thread_nominal_diameter")), 14.0)
        self.assertEqual(float(self.value("thread_pitch")), 1.0)
        self.assertEqual(float(self.value("male_thread_length")), 10.0)
        self.assertEqual(float(self.value("female_thread_depth")), 10.0)
        self.assertEqual(float(self.value("thread_clearance")), 0.25)

    def test_thread_crest_is_at_least_one_nozzle_wide(self):
        nozzle_diameter = float(self.value("nozzle_diameter"))
        thread_crest_width = float(self.value("thread_crest_width"))

        self.assertEqual(nozzle_diameter, 0.4)
        self.assertGreaterEqual(thread_crest_width, nozzle_diameter)
        self.assertIn(
            "assert(thread_crest_width >= nozzle_diameter", self.source
        )

    def test_basic_module_boundary(self):
        self.assertIn("module adapter_body()", self.source)
        self.assertIn("assert(extension_length >= female_thread_depth", self.source)

    def test_thread_modules_are_self_contained(self):
        expected_modules = (
            "left_hand_thread_ridge",
            "male_thread",
            "female_thread_cutter",
            "grip_cutters",
            "barrel_extension",
        )
        for module in expected_modules:
            self.assertRegex(self.source, rf"module\s+{module}\s*\(")
        self.assertIsNone(
            re.search(r"^\s*(use|include)\s*<", self.source, re.MULTILINE)
        )

    def test_left_hand_thread_uses_axial_helix_mesh(self):
        self.assertNotIn("linear_extrude(", self.source)
        self.assertIn("polyhedron(points = points, faces = faces", self.source)
        self.assertIn("angle = -360 * i / slices_per_turn", self.source)
        self.assertIn("center_z = start_z + i * pitch / slices_per_turn", self.source)

    def test_helix_caps_reverse_the_side_boundary_edges(self):
        self.assertIn("start_face = [0, 1, 2, 3]", self.source)
        self.assertIn(
            "end_face = [last_vertex + 3, last_vertex + 2, "
            "last_vertex + 1, last_vertex]",
            self.source,
        )

    def test_helix_side_faces_are_explicit_triangles(self):
        self.assertIn("each [[a, b, c], [a, c, d]]", self.source)

    def test_thread_mesh_is_clipped_to_requested_length(self):
        self.assertIn("clip_height = length", self.source)
        self.assertIn("cylinder(h = clip_height, r = crest_radius + 0.01)", self.source)

    def test_adapter_has_through_bore_and_both_threads(self):
        barrel = re.search(
            r"module\s+barrel_extension\s*\(\)\s*\{(?P<body>.*?)^\}",
            self.source,
            re.MULTILINE | re.DOTALL,
        )
        self.assertIsNotNone(barrel)
        body = barrel.group("body")
        self.assertIn("male_thread();", body)
        self.assertIn("female_thread_cutter();", body)
        self.assertIn("bore_diameter", body)

    def test_grip_cutters_extend_past_outer_surface(self):
        self.assertGreater(float(self.value("cutter_overshoot")), 0)
        self.assertIn("grip_depth + cutter_overshoot", self.source)

    def test_gauge_modules_exist(self):
        self.assertRegex(self.source, r"module\s+male_thread_gauge\s*\(")
        self.assertRegex(self.source, r"module\s+female_thread_gauge\s*\(")

    def test_output_modes_dispatch_to_all_models(self):
        self.assertIn('output_mode == "adapter"', self.source)
        self.assertIn('output_mode == "male_gauge"', self.source)
        self.assertIn('output_mode == "female_gauge"', self.source)
        self.assertIn("barrel_extension();", self.source)
        self.assertIn("male_thread_gauge();", self.source)
        self.assertIn("female_thread_gauge();", self.source)


if __name__ == "__main__":
    unittest.main()
