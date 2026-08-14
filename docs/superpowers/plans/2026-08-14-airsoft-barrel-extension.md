# 14mm逆ねじバレルエクステンション Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** M14×1左ねじのオス・メスを備え、アクセサリー座面を15mm前方へ移すPLA向けOpenSCADモデルと嵌合テストゲージを作る。

**Architecture:** `airsoft_barrel_extension.scad`を自己完結したパラメトリックモデルとし、左ねじ生成、アダプター本体、テストゲージを独立モジュールに分ける。Python標準ライブラリの契約テストでパラメーター、モジュール境界、出力モードを固定し、OpenSCAD CLIが利用可能な環境では各モードをSTLへレンダリングして形状エラーも検出する。

**Tech Stack:** OpenSCAD、Python 3.10 `unittest`、OpenSCAD CLI

## Global Constraints

- ねじ規格はM14×1左ねじとする。
- 有効延長は15mm、本体外径は19mm、中心貫通穴は直径10mmとする。
- メスねじ深さとオスねじ長さは各10mm、パーツ全長は25mmとする。
- FDM、0.4mmノズル、PLAを対象とし、ねじクリアランス初期値は0.25mmとする。
- 外部OpenSCADライブラリへ依存しない。
- STLはリポジトリへ追加しない。
- コミットには`git ai-commit`だけを使用し、`git commit`は使用しない。

---

### Task 1: モデル契約と基本形状

**Files:**
- Create: `tests/test_airsoft_barrel_extension.py`
- Create: `airsoft_barrel_extension.scad`

**Interfaces:**
- Consumes: なし
- Produces: OpenSCADパラメーター`output_mode`, `extension_length`, `body_diameter`, `bore_diameter`, `thread_nominal_diameter`, `thread_pitch`, `male_thread_length`, `female_thread_depth`, `thread_clearance`, `chamfer`; モジュール`adapter_body()`

- [ ] **Step 1: 契約テストを追加する**

```python
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "airsoft_barrel_extension.scad"


class AirsoftBarrelExtensionContractTest(unittest.TestCase):
    def setUp(self):
        self.source = MODEL.read_text(encoding="utf-8")

    def value(self, name):
        match = re.search(rf"^{name}\\s*=\\s*([^;]+);", self.source, re.MULTILINE)
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

    def test_basic_module_boundary(self):
        self.assertIn("module adapter_body()", self.source)
        self.assertIn("assert(extension_length >= female_thread_depth", self.source)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `python3 -m unittest tests/test_airsoft_barrel_extension.py -v`

Expected: ERROR with `FileNotFoundError` for `airsoft_barrel_extension.scad`.

- [ ] **Step 3: パラメーターと基本形状を実装する**

`airsoft_barrel_extension.scad`に次の骨格を作る。

```openscad
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

adapter_body();
```

- [ ] **Step 4: 契約テストが通ることを確認する**

Run: `python3 -m unittest tests/test_airsoft_barrel_extension.py -v`

Expected: 2 tests PASS.

- [ ] **Step 5: 基本形状をコミットする**

```bash
git add tests/test_airsoft_barrel_extension.py airsoft_barrel_extension.scad
git ai-commit --context "Define the validated dimensions and module boundary for the barrel extension before adding printable threads."
```

---

### Task 2: 左ねじとグリップを実装する

**Files:**
- Modify: `tests/test_airsoft_barrel_extension.py`
- Modify: `airsoft_barrel_extension.scad`

**Interfaces:**
- Consumes: Task 1の全パラメーターと`adapter_body()`
- Produces: `left_hand_thread_ridge(major_diameter, pitch, length, clearance, internal)`, `male_thread()`, `female_thread_cutter()`, `grip_cutters()`, `barrel_extension()`

- [ ] **Step 1: ねじと完成形の契約テストを追加する**

```python
    def test_thread_modules_are_self_contained(self):
        expected_modules = (
            "left_hand_thread_ridge",
            "male_thread",
            "female_thread_cutter",
            "grip_cutters",
            "barrel_extension",
        )
        for module in expected_modules:
            self.assertRegex(self.source, rf"module\\s+{module}\\s*\\(")
        self.assertIsNone(
            re.search(r"^\\s*(use|include)\\s*<", self.source, re.MULTILINE)
        )

    def test_left_hand_twist_is_negative(self):
        self.assertRegex(
            self.source,
            r"linear_extrude\\([^)]*twist\\s*=\\s*-360\\s*\\*\\s*length\\s*/\\s*pitch",
        )

    def test_adapter_has_through_bore_and_both_threads(self):
        barrel = re.search(
            r"module\\s+barrel_extension\\s*\\(\\)\\s*\\{(?P<body>.*?)^\\}",
            self.source,
            re.MULTILINE | re.DOTALL,
        )
        self.assertIsNotNone(barrel)
        body = barrel.group("body")
        self.assertIn("male_thread();", body)
        self.assertIn("female_thread_cutter();", body)
        self.assertIn("bore_diameter", body)
```

- [ ] **Step 2: 追加テストが失敗することを確認する**

Run: `python3 -m unittest tests/test_airsoft_barrel_extension.py -v`

Expected: 3 new tests FAIL because the thread and grip modules do not exist.

- [ ] **Step 3: 自己完結したM14×1左ねじを実装する**

実装時は次の規則をコードへ反映する。

```openscad
thread_height = 0.55;
thread_flat = 0.18;

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
```

`male_thread()`は直径`thread_nominal_diameter - 2 * thread_clearance`の芯円筒と外側の左ねじ山を結合する。`female_thread_cutter()`は`thread_nominal_diameter + 2 * thread_clearance`を基準に、入口面取りを含む切削形状を作る。`barrel_extension()`は本体、前端のオスねじ、後端のメスねじ、直径10mmの貫通穴を組み合わせ、座面間距離を15mmに保つ。`grip_cutters()`は本体外周へ24本、深さ0.5mmの縦溝を付ける。

- [ ] **Step 4: 全契約テストが通ることを確認する**

Run: `python3 -m unittest tests/test_airsoft_barrel_extension.py -v`

Expected: 5 tests PASS.

- [ ] **Step 5: OpenSCAD CLIがある環境で本体をレンダリングする**

Run: `openscad -o /tmp/airsoft-barrel-extension.stl airsoft_barrel_extension.scad`

Expected: exit 0、`WARNING`または`ERROR`なし、空でないSTLが生成される。OpenSCAD CLIがない環境では未実施として記録し、契約テスト結果とともに引き継ぐ。

- [ ] **Step 6: ねじ実装をコミットする**

```bash
git add tests/test_airsoft_barrel_extension.py airsoft_barrel_extension.scad
git ai-commit --context "Add printable M14x1 left-hand male and female threads with adjustable FDM clearance and hand-tightening grip."
```

---

### Task 3: テストゲージ、README、最終検証

**Files:**
- Modify: `tests/test_airsoft_barrel_extension.py`
- Modify: `airsoft_barrel_extension.scad`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 2のねじモジュールと`barrel_extension()`
- Produces: `male_thread_gauge()`, `female_thread_gauge()`、`output_mode`による`adapter`/`male_gauge`/`female_gauge`の出力切り替え

- [ ] **Step 1: 出力モードの契約テストを追加する**

```python
    def test_output_modes_dispatch_to_all_models(self):
        self.assertIn('output_mode == "adapter"', self.source)
        self.assertIn('output_mode == "male_gauge"', self.source)
        self.assertIn('output_mode == "female_gauge"', self.source)
        self.assertIn("barrel_extension();", self.source)
        self.assertIn("male_thread_gauge();", self.source)
        self.assertIn("female_thread_gauge();", self.source)

    def test_gauge_modules_exist(self):
        self.assertRegex(self.source, r"module\\s+male_thread_gauge\\s*\\(")
        self.assertRegex(self.source, r"module\\s+female_thread_gauge\\s*\\(")
```

- [ ] **Step 2: 追加テストが失敗することを確認する**

Run: `python3 -m unittest tests/test_airsoft_barrel_extension.py -v`

Expected: 2 new tests FAIL because gauge modules and dispatch do not exist.

- [ ] **Step 3: テストゲージと出力切り替えを実装する**

`male_thread_gauge()`は長さ5mmのオスねじと直径19mm、高さ3mmのつまみを作る。`female_thread_gauge()`は直径19mm、高さ8mmの円筒から深さ5mmのメスねじを切り、中心穴を貫通させる。末尾の出力切り替えは次の形にする。

```openscad
if (output_mode == "adapter") {
    barrel_extension();
} else if (output_mode == "male_gauge") {
    male_thread_gauge();
} else if (output_mode == "female_gauge") {
    female_thread_gauge();
} else {
    assert(false, str("unknown output_mode: ", output_mode));
}
```

- [ ] **Step 4: READMEへ使い方と安全上の制約を追記する**

追記には、M14×1左ねじ、有効延長15mm、外径19mm、貫通穴10mm、出力モード3種、クリアランスの0.05mm刻み調整、0.16〜0.2mmレイヤー、4周以上、40%以上のインフィル、メス側を下にした垂直造形、手締め専用、実銃・高圧・高温用途不可を明記する。

- [ ] **Step 5: 契約テストをすべて実行する**

Run: `python3 -m unittest tests/test_airsoft_barrel_extension.py -v`

Expected: 7 tests PASS.

- [ ] **Step 6: OpenSCAD CLIで3モードをレンダリングする**

```bash
openscad -D 'output_mode="adapter"' -o /tmp/airsoft-adapter.stl airsoft_barrel_extension.scad
openscad -D 'output_mode="male_gauge"' -o /tmp/airsoft-male-gauge.stl airsoft_barrel_extension.scad
openscad -D 'output_mode="female_gauge"' -o /tmp/airsoft-female-gauge.stl airsoft_barrel_extension.scad
```

Expected: 3コマンドすべてexit 0、`WARNING`または`ERROR`なし、各STLが空でない。OpenSCAD CLIがない環境では未実施として明記する。

- [ ] **Step 7: ドキュメントと完成形をコミットする**

```bash
git add tests/test_airsoft_barrel_extension.py airsoft_barrel_extension.scad README.md
git ai-commit --context "Add selectable thread-fit gauges and document PLA printing, fit adjustment, and non-pressure-bearing use."
```

---

## 最終確認

- `python3 -m unittest tests/test_airsoft_barrel_extension.py -v`が7件すべて成功する。
- OpenSCAD CLIが利用可能なら3モードをレンダリングし、警告・エラー・空ファイルがない。
- `git status --short`に設計書、計画書、実装対象以外の差分がない。
- 生成したSTLがリポジトリへ追加されていない。
- 実物ではゲージから先に造形し、クリアランスを確定してから本体を造形する。
