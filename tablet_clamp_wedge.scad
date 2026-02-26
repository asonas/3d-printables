// Tablet Clamp Wedge Adapter
// 傾斜した天板（14°）でタブレットクランプを水平に保つための治具
// コの字型で天板を挟み、クランプは水平面を挟める
// C-shaped adapter for tilted desk - clamp grips horizontal surfaces
//
// 設計思想：
// - 天板は手前に14°傾斜している
// - クランプは天板の奥側に取り付ける
// - この治具の外側（上面・下面）は水平 → クランプが水平に挟める
// - 治具の内側は天板の傾斜に沿った角度
// - コの字型で手前が開口（天板を奥からスライドして装着）

// ========================================
// Parameters
// ========================================

// Desk parameters
desk_tilt_angle = 14;      // 天板の傾斜角度 (degrees)
desk_thickness = 18;       // 天板の厚み (mm)

// Clamp parameters
clamp_grip_diameter = 45;  // クランプの抑える部分の直径 (mm)
clamp_base_depth = 80;     // クランプ台座の奥行き (mm)
clamp_base_width = 50;     // クランプ台座の幅 (mm)

// Adapter parameters
adapter_margin = 5;        // 台座より少し大きくするためのマージン (mm)
adapter_width = clamp_base_width + adapter_margin * 2;   // アダプターの幅
adapter_depth = clamp_base_depth + adapter_margin * 2;   // アダプターの奥行き

// 天板スロットのパラメータ
slot_tolerance = 1.0;      // 天板を入れやすくするための余裕 (mm)
slot_opening_depth = adapter_depth - 10;  // コの字の開口部の奥行き（奥10mmは壁）

// 上下のクランプ挟み込み部分の厚み
min_wall_thickness = 8;    // 最小壁厚（強度確保）

// 3D印刷用の調整
print_tolerance = 0.3;

// ========================================
// Calculated dimensions
// ========================================

// 天板スロットの高さ（公差込み）
slot_height = desk_thickness + slot_tolerance * 2;

// 傾斜による高さの差（スロット開口部の奥行きに基づく）
tilt_height_diff = tan(desk_tilt_angle) * slot_opening_depth;

// 全体の高さ
// 奥側（最も高い位置）を基準：下部壁(厚い) + スロット + 上部壁(薄い)
// = min_wall_thickness + tilt_height_diff + slot_height + min_wall_thickness
total_height = min_wall_thickness * 2 + tilt_height_diff + slot_height;

// ========================================
// Modules
// ========================================

// 傾斜した天板スロット（くり抜き用）
module tilted_slot() {
    // 天板の傾斜に合わせたスロット
    // 天板は手前に傾いている → 手前が低く、奥が高い
    // Y軸: 手前=0、奥=adapter_depth

    slot_extra = 1;  // はみ出し用マージン

    // スロットの下面位置
    // 手前が低い（下部壁が薄い）、奥が高い（下部壁が厚い）
    slot_bottom_front = min_wall_thickness;
    slot_bottom_back = min_wall_thickness + tan(desk_tilt_angle) * slot_opening_depth;

    // スロットの上面位置（下面 + 天板厚み）
    slot_top_front = slot_bottom_front + slot_height;
    slot_top_back = slot_bottom_back + slot_height;

    // 傾斜したスロットをpolyhedronで作成
    points = [
        // 底面（天板下面に沿う傾斜：手前が低く、奥が高い）
        [-slot_extra, -slot_extra, slot_bottom_front],                    // 0: 手前左下
        [adapter_width + slot_extra, -slot_extra, slot_bottom_front],     // 1: 手前右下
        [adapter_width + slot_extra, slot_opening_depth, slot_bottom_back], // 2: 奥右下
        [-slot_extra, slot_opening_depth, slot_bottom_back],              // 3: 奥左下

        // 上面（天板上面に沿う傾斜：手前が低く、奥が高い）
        [-slot_extra, -slot_extra, slot_top_front],                       // 4: 手前左上
        [adapter_width + slot_extra, -slot_extra, slot_top_front],        // 5: 手前右上
        [adapter_width + slot_extra, slot_opening_depth, slot_top_back],  // 6: 奥右上
        [-slot_extra, slot_opening_depth, slot_top_back]                  // 7: 奥左上
    ];

    faces = [
        [0, 3, 2, 1],     // 底面
        [4, 5, 6, 7],     // 上面
        [0, 1, 5, 4],     // 手前面
        [2, 3, 7, 6],     // 奥面
        [0, 4, 7, 3],     // 左側面
        [1, 2, 6, 5]      // 右側面
    ];

    polyhedron(points = points, faces = faces);
}

// 外形ブロック（水平な上面と下面）
module outer_block() {
    cube([adapter_width, adapter_depth, total_height]);
}

// コの字型アダプター本体
module adapter_body() {
    difference() {
        outer_block();
        tilted_slot();
    }
}

// 完成したアダプター
module tablet_clamp_adapter() {
    adapter_body();
}

// ========================================
// Render
// ========================================

tablet_clamp_adapter();

// ========================================
// Debug info
// ========================================

// 壁厚の計算（デバッグ用）
lower_wall_front = min_wall_thickness;
lower_wall_back = min_wall_thickness + tilt_height_diff;
upper_wall_front = total_height - (min_wall_thickness + slot_height);
upper_wall_back = total_height - (min_wall_thickness + tilt_height_diff + slot_height);

echo("=== Tablet Clamp Adapter Dimensions ===");
echo(str("Desk tilt angle: ", desk_tilt_angle, " degrees"));
echo(str("Desk thickness: ", desk_thickness, " mm"));
echo(str("Adapter width: ", adapter_width, " mm"));
echo(str("Adapter depth: ", adapter_depth, " mm"));
echo(str("Total height: ", total_height, " mm"));
echo(str("Slot height (with tolerance): ", slot_height, " mm"));
echo(str("Tilt compensation: ", tilt_height_diff, " mm"));
echo("--- Wall Thickness ---");
echo(str("Lower wall (front/back): ", lower_wall_front, " / ", lower_wall_back, " mm"));
echo(str("Upper wall (front/back): ", upper_wall_front, " / ", upper_wall_back, " mm"));
