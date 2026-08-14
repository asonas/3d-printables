# Smooth Airsoft Barrel Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存のシボ付きモデルを残し、外周が直径19mmの滑らかな円筒である別モデルを追加する。

**Architecture:** `airsoft_barrel_extension_smooth.scad`は、既存モデルのねじ生成、寸法、出力モードを維持する自己完結ファイルとする。外周溝のパラメーター、モジュール、差し引き処理だけを含めない。専用のPython契約テストで、別ファイルであることと滑らかな外周を固定する。

**Tech Stack:** OpenSCAD 2021.01、Python 3.10 `unittest`、Windows版OpenSCAD CLI

## Global Constraints

- `airsoft_barrel_extension.scad`は変更しない。
- 新しいモデルは`airsoft_barrel_extension_smooth.scad`へ保存する。
- 本体外周は直径19mmの円筒とし、縦溝やシボを設けない。
- 有効延長は15mm、ねじ規格はM14×1左ねじ、中心貫通穴は直径10mmとする。
- オスねじ長さとメスねじ深さは各10mm、ねじクリアランス初期値は0.25mmとする。
- `adapter`、`male_gauge`、`female_gauge`の出力モードを維持する。
- コミットには`git ai-commit`だけを使用する。

---

### Task 1: 滑らかな円筒版を別ファイルで追加する

**Files:**
- Create: `airsoft_barrel_extension_smooth.scad`
- Create: `tests/test_airsoft_barrel_extension_smooth.py`

**Interfaces:**
- Consumes: `airsoft_barrel_extension.scad`の寸法、ねじ生成モジュール、出力モード
- Produces: 外周溝を持たない自己完結モデル`airsoft_barrel_extension_smooth.scad`

- [ ] **Step 1: 別ファイルと滑らかな外周の契約テストを書く**

```python
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
            rf"^{name}\\s*=\\s*([^;]+);", self.smooth_source, re.MULTILINE
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
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `env PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tests/test_airsoft_barrel_extension_smooth.py -v`

Expected: ERROR with `FileNotFoundError` for `airsoft_barrel_extension_smooth.scad`.

- [ ] **Step 3: 滑らかな円筒版を作る**

`airsoft_barrel_extension.scad`を新しいファイルへ複製し、次の要素だけを削除する。

```openscad
grip_count = 24;
grip_depth = 0.5;
cutter_overshoot = 0.2;
```

```openscad
module grip_cutters() {
    // モジュール全体を削除する
}
```

`barrel_extension()`の`difference()`から次の呼び出しを削除する。

```openscad
grip_cutters();
```

ねじ生成、直径19mmの本体円筒、貫通穴、面取り、3つの出力モードは既存モデルと同じ内容を維持する。

- [ ] **Step 4: 全契約テストを実行する**

Run: `env PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_*.py' -v`

Expected: 既存12件と新規2件の合計14件がPASSする。

- [ ] **Step 5: Windows版OpenSCADで3モードをレンダリングする**

```bash
openscad.exe -D 'output_mode="adapter"' -o /tmp/airsoft-smooth-adapter.stl airsoft_barrel_extension_smooth.scad
openscad.exe -D 'output_mode="male_gauge"' -o /tmp/airsoft-smooth-male-gauge.stl airsoft_barrel_extension_smooth.scad
openscad.exe -D 'output_mode="female_gauge"' -o /tmp/airsoft-smooth-female-gauge.stl airsoft_barrel_extension_smooth.scad
```

Expected: 3コマンドとも警告なしで終了し、各STLが単一連結形状になる。本体の境界はX/Yが±9.5mm、Zが0〜25mmになる。

- [ ] **Step 6: 追加した2ファイルだけをコミットする**

```bash
git add airsoft_barrel_extension_smooth.scad tests/test_airsoft_barrel_extension_smooth.py
git ai-commit --context "Add a separate smooth-cylinder variant while preserving the existing textured barrel extension."
```

---

## 最終確認

- 既存の`airsoft_barrel_extension.scad`に差分がない。
- 新しいモデルに外周溝の識別子がない。
- 全14テストが成功する。
- 3つのSTLが警告なしで生成され、単一連結形状になる。
- ユーザーが生成した既存STLを上書きしない。
