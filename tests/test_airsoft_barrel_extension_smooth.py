from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
TEXTURED_MODEL = ROOT / "airsoft_barrel_extension.scad"
SMOOTH_MODEL = ROOT / "airsoft_barrel_extension_smooth.scad"


class SmoothAirsoftBarrelExtensionContractTest(unittest.TestCase):
    def setUp(self):
        self.textured_source = TEXTURED_MODEL.read_text(encoding="utf-8")
        self.smooth_source = SMOOTH_MODEL.read_text(encoding="utf-8")

    def value(self, name):
        match = re.search(
            rf"^{name}\s*=\s*([^;]+);", self.smooth_source, re.MULTILINE
        )
        self.assertIsNotNone(match, f"missing parameter: {name}")
        return match.group(1).strip().strip('"')

    def test_preserves_required_dimensions_and_modes(self):
        self.assertEqual(float(self.value("extension_length")), 15.0)
        self.assertEqual(float(self.value("body_diameter")), 19.0)
        self.assertEqual(float(self.value("bore_diameter")), 10.0)
        self.assertEqual(float(self.value("thread_pitch")), 1.0)
        self.assertEqual(float(self.value("thread_clearance")), 0.25)
        for mode in ("adapter", "male_gauge", "female_gauge"):
            self.assertIn(f'output_mode == "{mode}"', self.smooth_source)

    def test_smooth_variant_has_no_outer_grip_details(self):
        self.assertIn("module grip_cutters()", self.textured_source)
        self.assertNotIn("grip_count", self.smooth_source)
        self.assertNotIn("grip_depth", self.smooth_source)
        self.assertNotIn("cutter_overshoot", self.smooth_source)
        self.assertNotIn("module grip_cutters()", self.smooth_source)
        self.assertNotIn("grip_cutters();", self.smooth_source)


if __name__ == "__main__":
    unittest.main()
