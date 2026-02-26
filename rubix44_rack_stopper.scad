// Rubix44 ラックスライド防止ブロック
// MIDDLE ATLANTIC U1 1Uトレイ上で ROLAND Rubix44 が奥に滑るのを防ぐスペーサー
// トレイ奥面と Rubix44 背面の間に挟んで使用する

// ========================================
// パラメータ定義
// ========================================

// MIDDLE ATLANTIC U1 1Uトレイ寸法
tray_depth = 273.8;        // トレイ奥行き (10.78インチ)

// ROLAND Rubix44 寸法
rubix44_width = 310;       // Rubix44 幅
rubix44_depth = 165;       // Rubix44 奥行き
rubix44_height = 46;       // Rubix44 高さ

// ブロック設定
front_margin = 5;          // Rubix44 前面がトレイ前端から少し奥まる余白 (mm)
block_depth = tray_depth - rubix44_depth - front_margin;  // ~103.8mm

block_width = 200;         // ブロック幅 (3Dプリンタベッドに合わせて調整可能)
block_height = 12;         // ブロック高さ (背面ケーブルに干渉しない高さ)
                           // Rubix44背面コネクタ(USB/TRS/MIDI)は底面から約15mm以上の位置

// 軽量化用の肉抜き設定
enable_hollowing = true;   // 肉抜きを有効にする
wall_thickness = 3;        // 壁の厚さ (mm)

// ========================================
// メインブロック
// ========================================

module solid_block() {
    cube([block_width, block_depth, block_height]);
}

module hollowed_block() {
    difference() {
        solid_block();

        // 内部を肉抜き (上面が開口)
        if (enable_hollowing && block_height > wall_thickness * 2) {
            translate([wall_thickness, wall_thickness, wall_thickness])
                cube([
                    block_width - wall_thickness * 2,
                    block_depth - wall_thickness * 2,
                    block_height  // 上面を突き抜けて開口
                ]);
        }
    }
}

// ========================================
// レンダリング
// ========================================

if (enable_hollowing) {
    hollowed_block();
} else {
    solid_block();
}

// ========================================
// デバッグ用: Rubix44 ゴースト表示
// ========================================

show_rubix44_ghost = false;

if (show_rubix44_ghost) {
    // ブロックの手前側にRubix44を配置
    translate([(block_width - rubix44_width) / 2, -rubix44_depth, 0])
        %cube([rubix44_width, rubix44_depth, rubix44_height]);
}
