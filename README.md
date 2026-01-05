# NCASE M1 3.5" HDD Bracket

NCASE M1 PCケースのサイドパネル用HDDブラケットの3Dモデルです。

## 仕様

- **対応HDD**: 3.5インチHDD 1台
- **構成**: 2ピース（左右の耳型ブラケット）
- **ケース取り付け**: M4 Flat Head ネジ（各ブラケット2箇所）
- **HDD取り付け**: #6-32 pan head w/shoulder ネジ（各ブラケット2箇所）

## デザイン

```
    左ブラケット              右ブラケット
    ┌────┬─┐                  ┌─┬────┐
    │ ○  │ │                  │ │  ○ │
    │    │●│  ← HDD →        │●│    │
    │    │●│                  │●│    │
    │ ○  │ │                  │ │  ○ │
    └────┴─┘                  └─┴────┘

    ○ = M4穴（ケース取り付け用）
    ● = #6-32穴（HDD取り付け用）
```

## ファイル

- `hdd_bracket.scad` - OpenSCADソースファイル

## カスタマイズ

`hdd_bracket.scad`の冒頭にあるパラメータを編集することで、寸法を調整できます：

```openscad
// ブラケット寸法
bracket_thickness = 3;        // ブラケットの板厚
bracket_wall_height = 20;     // 側面壁の高さ
bracket_flange_width = 20;    // ケース取り付け用フランジの幅
bracket_length = 50;          // ブラケットの長さ

// 表示設定
show_left = true;             // 左ブラケットを表示
show_right = true;            // 右ブラケットを表示
show_hdd_ghost = false;       // HDDのゴースト表示
```

## 使い方

1. OpenSCADで `hdd_bracket.scad` を開く
2. F5キーでプレビュー、F6キーでレンダリング
3. 必要に応じて `show_hdd_ghost = true;` でHDDの位置を確認
4. STLにエクスポート（File → Export → Export as STL）
5. スライサーソフトで印刷設定を行う

## 印刷推奨設定

- **素材**: PETG または ABS（強度が必要な場合）
- **インフィル**: 30%以上
- **レイヤー高さ**: 0.2mm
- **壁の厚さ**: 1.2mm以上
- **向き**: フランジ部分を下にして印刷

## 組み立て

1. 左右のブラケットをそれぞれHDDの側面に#6-32ネジで取り付け
2. HDDを取り付けた状態でケースのサイドパネルにM4ネジで固定

## 参考資料

- [NCASE M1 V6 Manual (PDF)](https://cdn.shopify.com/s/files/1/0261/5623/6860/files/NCASE-M1-V6-Manual.pdf)

## ライセンス

MIT License
