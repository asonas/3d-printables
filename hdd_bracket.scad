// NCASE M1 HDD Bracket for 3.5" HDD
// 2ピース構成（左右の耳型ブラケット）
// ケースへの取り付け: M4 Flat Head
// HDDの取り付け: #6-32 pan head w/shoulder

// ========================================
// パラメータ定義
// ========================================

// 3.5" HDD 標準寸法
hdd_width = 101.6;      // HDDの幅
hdd_height = 26.1;      // HDDの高さ
hdd_length = 146;       // HDDの長さ

// HDD側面ネジ穴位置 (#6-32)
// 底面から6.35mm、前面からの距離
hdd_screw_height_from_bottom = 6.35;        // HDDの底面からネジ穴までの高さ
hdd_screw_positions = [41.28, 76.20, 101.60]; // 前面からの距離（3箇所）

// HDDの向き設定（ラベル面を外側に向ける場合はtrue）
hdd_label_side_out = true;

// ネジ穴のZ軸オフセット（微調整用）
hdd_screw_z_offset = 2;                     // Z軸方向に追加のオフセット（mm）

// 実際のネジ穴高さを計算
// ラベル面を外側にする場合、HDDを上下逆にするのでネジ穴の高さが変わる
hdd_screw_height = hdd_label_side_out
    ? (hdd_height - hdd_screw_height_from_bottom + hdd_screw_z_offset)  // 逆さ: 上面基準
    : (hdd_screw_height_from_bottom + hdd_screw_z_offset);              // 通常: 底面基準

// ネジ穴直径
m4_hole_diameter = 4.5;       // M4用貫通穴（少し余裕を持たせる）
hdd_screw_hole_diameter = 3.6; // #6-32用貫通穴

// ブラケット寸法
bracket_thickness = 3;        // ブラケットの板厚
bracket_wall_height = 25;     // 側面壁の高さ（HDDを支える部分）
bracket_flange_width = 13;    // ケース取り付け用フランジの幅（2mm削減）

// 120mmファン規格（ケース取り付け穴）
fan_hole_spacing = 105;       // 120mmファンのネジ穴間隔
case_mount_margin_y = 10;     // 端からの距離（Y方向）※5mm→10mmでY軸方向に伸ばす
bracket_length = fan_hole_spacing + case_mount_margin_y * 2;  // 125mm

// ケース取り付け穴の位置（フランジ上）
// 壁の厚みを除いた耳の幅の中央に配置
// 耳の幅（壁を除く）= bracket_flange_width - bracket_thickness = 13 - 3 = 10mm
// その中央 = 10 / 2 = 5mm
case_mount_margin_x = (bracket_flange_width - bracket_thickness) / 2;  // 5mm

// HDD取り付け穴のY軸オフセット
// HDDの前面（SATA端子側）がY=0方向に来るように配置
// HDDの最初の穴は前面から41.28mmの位置にある
hdd_first_hole_offset_y = 5;  // ブラケット端からHDDの最初のネジ穴までの距離（穴がはみ出さないよう調整）

// 表示設定
show_left = true;             // 左ブラケットを表示
show_right = true;            // 右ブラケットを表示
show_hdd_ghost = false;       // HDDのゴースト表示

// ========================================
// 左側ブラケット（耳型）
// ========================================

module left_bracket() {
    difference() {
        union() {
            // フランジ部分（ケース取り付け用、水平）
            cube([bracket_flange_width, bracket_length, bracket_thickness]);

            // 壁部分（HDD取り付け用、垂直）
            translate([bracket_flange_width - bracket_thickness, 0, 0])
                cube([bracket_thickness, bracket_length, bracket_wall_height]);
        }

        // ケース取り付け穴（M4）
        left_case_mount_holes();

        // HDD取り付け穴（#6-32）
        left_hdd_mount_holes();
    }
}

// 左側ブラケットのM4穴
module left_case_mount_holes() {
    positions = [
        [case_mount_margin_x, case_mount_margin_y, 0],
        [case_mount_margin_x, bracket_length - case_mount_margin_y, 0]
    ];

    for (pos = positions) {
        translate(pos)
            cylinder(h = bracket_thickness * 2, d = m4_hole_diameter, center = true, $fn = 32);
    }
}

// 左側ブラケットの#6-32穴
module left_hdd_mount_holes() {
    // HDDの一番遠い2つのネジ穴間隔（41.28mmと101.60mmの差分 = 60.32mm）
    screw_spacing = hdd_screw_positions[2] - hdd_screw_positions[0]; // 60.32mm

    // Y軸方向のネジ穴位置（SATA端子側がY=0方向に来るように配置）
    screw_positions_y = [
        hdd_first_hole_offset_y,                    // 1つ目の穴（前面から41.28mm）
        hdd_first_hole_offset_y + screw_spacing     // 2つ目の穴（前面から101.60mm）
    ];

    for (y = screw_positions_y) {
        translate([bracket_flange_width - bracket_thickness - 1, y, hdd_screw_height])
            rotate([0, 90, 0])
                cylinder(h = bracket_thickness + 2, d = hdd_screw_hole_diameter, $fn = 32);
    }
}

// ========================================
// 右側ブラケット（耳型、左の鏡像）
// ========================================

module right_bracket() {
    mirror([1, 0, 0])
        left_bracket();
}

// ========================================
// レンダリング
// ========================================

// パーツ間の間隔
part_spacing = 5;

// 左右のブラケットを配置（印刷用に並べて表示）
if (show_left) {
    translate([0, 0, 0])
        left_bracket();
}

if (show_right) {
    // 右ブラケットはmirrorで反転しているので、左ブラケットの右端 + 間隔 + 右ブラケットの幅分オフセット
    translate([bracket_flange_width + part_spacing + bracket_flange_width, 0, 0])
        right_bracket();
}

// デバッグ用：HDDのゴースト表示
if (show_hdd_ghost) {
    // 左ブラケットを基準にHDDを配置
    screw_spacing = hdd_screw_positions[1] - hdd_screw_positions[0];
    screw_offset_y = (bracket_length - screw_spacing) / 2;
    hdd_front_y = -hdd_screw_positions[0] + screw_offset_y;

    %translate([bracket_flange_width, hdd_front_y, 0])
        cube([hdd_width, hdd_length, hdd_height]);
}

// ========================================
// 組み立て確認用（コメント解除で使用）
// ========================================

/*
// 実際の取り付け位置で表示
module assembly_view() {
    screw_spacing = hdd_screw_positions[1] - hdd_screw_positions[0];
    screw_offset_y = (bracket_length - screw_spacing) / 2;
    hdd_front_y = -hdd_screw_positions[0] + screw_offset_y;

    // 左ブラケット
    left_bracket();

    // 右ブラケット（HDDの反対側に配置）
    translate([bracket_flange_width + hdd_width + bracket_flange_width, 0, 0])
        right_bracket();

    // HDD（ゴースト）
    %translate([bracket_flange_width, hdd_front_y, 0])
        cube([hdd_width, hdd_length, hdd_height]);
}

assembly_view();
*/
