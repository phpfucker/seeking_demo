# Minecraft AI生命体プロジェクト

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 概要

Minecraftの世界でAIが生み出す生命体（例：adam/eve）の進化・行動・社会形成を観察・実験できるMOD＋AI連携システムです。

---

## 主な特徴
- AIが自動生成した個体データ（DNA/性別/座標など）をJSONで管理
- MODがワールド内に個体をスポーンし、状態をリアルタイムでファイル出力
- Node.js/Python等の外部AIと連携し、進化・繁殖・行動を自動化
- Blockbenchモデル・EMF/ETF/Fresh Animations等のリソース対応
- 拡張性・保守性重視のクリーンアーキテクチャ

---

## 必要環境
- Java 17（JDK 17）
- Minecraft Forge 1.20.1
- Node.js（LTS推奨）
- **Entity Model Features（EMF）: 2.4.1+mc1.20.1**  
  [Modrinth EMFダウンロード](https://modrinth.com/mod/entity-model-features/versions?l=forge&g=1.20.1)
- **Entity Texture Features（ETF）: 6.2.9+mc1.20.1**  
  [Modrinth ETFダウンロード](https://modrinth.com/mod/entitytexturefeatures/versions?l=forge&g=1.20.1)

---

## クイックスタート

### 1. リポジトリ取得＆ビルド
```bash
git clone <このリポジトリのURL>
cd seekin_demo/minecraft
./gradlew clean build
```

### 2. MOD/依存MODの配置
- `build/libs/ailife-1.0.0.jar` → サーバー/クライアントの `mods/` フォルダ
- EMF（**2.4.1+mc1.20.1**）→ `mods/` フォルダ  
  [EMFダウンロードページ](https://modrinth.com/mod/entity-model-features/versions?l=forge&g=1.20.1)
- ETF（**6.2.9+mc1.20.1**）→ `mods/` フォルダ  
  [ETFダウンロードページ](https://modrinth.com/mod/entitytexturefeatures/versions?l=forge&g=1.20.1)

### 3. AIデータの配置
- `generated_entities.json`/`initial_adam_eve.json` → サーバーの `config/` フォルダ

### 4. サーバー起動・動作確認
- Forgeサーバーを起動
- `/ailife export_status` コマンドでJSON出力を確認

---

## VPS環境での設定

### 環境変数設定（VPS初回設定時のみ）
```bash
# VPSにSSH接続後、NODE_ENVをproductionに設定
echo 'export NODE_ENV=production' >> ~/.bashrc
source ~/.bashrc
  ```

---

## 開発手順

1. **JDK 17必須**（`java -version`で確認）
2. `./gradlew test` でテスト実行
3. `./gradlew build` でJAR生成
4. Node.jsスクリプトは `scripts/` 配下
5. Blockbench等でモデル・スキン作成可

---

## 運用・公開手順

- サーバー/クライアントとも `mods/` にMOD・EMF・ETFを配置（バージョンは上記参照）
- AIデータ（JSON）は `config/` に設置
- MODやJSONを更新したらサーバー再起動
- 詳細な運用例・トラブルシュートは[docs/運用ガイド.md](docs/運用ガイド.md)等参照（※必要に応じて作成）

---

## 進化サイクル自動化システム（5.6）

### 概要
Minecraft AI生命体の進化サイクルを1時間ごとに自動実行するシステムです。

### 主な構成
- `scripts/auto-minecraft-evolution.js`（メイン自動化スクリプト）
- `scripts/evolution-cycle-manager.js`（進化サイクル統合管理）
- `scripts/rcon-manager.js`（RCON接続・コマンド実行）
- `scripts/evolution-validator.js`（データバリデーション）
- 既存の5つの進化系スクリプト（status-data-integration.js等）

### 使い方

#### 1. 環境変数設定
```bash
export NODE_ENV=production
export RCON_HOST=localhost
export RCON_PORT=25575
export RCON_PASSWORD=your_rcon_password
```

#### 2. 自動進化サイクルの起動
```bash
node scripts/auto-minecraft-evolution.js
```

#### 3. オプション
- `--test-cycle` : テストサイクルを実行してから開始
- `--immediate` : 起動時に即座に進化サイクルを実行
- `--status` : 現在の状態を表示
- `--help` : ヘルプを表示

#### 4. 統合テスト
```bash
node scripts/test-5.6-integration.js
```

### ログファイル
- 開発: `./logs/auto-evolution.log`, `./logs/validation.log`
- 本番: `/opt/minecraft_forge_server/logs/auto-evolution.log`, `/opt/minecraft_forge_server/logs/validation.log`

### トラブルシュート
- RCON接続失敗: パスワード・ポート・サーバー設定を確認
- スクリプト実行失敗: ログファイルで詳細確認
- バリデーション失敗: JSON構文・必須フィールド・型を確認

### 開発・テスト
- TDD推奨。各クラス・スクリプトにテストファイルあり
- `npm test` でテスト実行
- JSDocコメント・詳細は各スクリプト参照

---

## 毎日自動進化サイクル（Cron設定）

### 概要
毎日午前3時に進化サイクル実行 + サーバー再起動を自動で行います。新個体のスポーンが目的です。

### セットアップ手順

#### 1. スクリプトの配置
```bash
# VPSの適切な場所にスクリプトを配置
cp scripts/daily-evolution.sh /opt/minecraft_forge_server/ailife-scripts/
chmod +x /opt/minecraft_forge_server/ailife-scripts/daily-evolution.sh
```

#### 2. Cron設定
```bash
# crontabを編集
sudo crontab -e

# 以下の1行を追加（毎日午前3時実行）
0 3 * * * /bin/bash /opt/minecraft_forge_server/ailife-scripts/daily-evolution.sh >> /opt/minecraft_forge_server/logs/daily-evolution.log 2>&1
```

#### 3. 動作確認
```bash
# 手動テスト実行
sudo /opt/minecraft_forge_server/ailife-scripts/daily-evolution.sh

# ログ確認
tail -f /opt/minecraft_forge_server/logs/daily-evolution.log
```

### スクリプト内容
`daily-evolution.sh`は以下を順次実行します：
1. 進化サイクル実行（`node auto-minecraft-evolution.js --once`）
2. Minecraftサーバー停止
3. Minecraftサーバー起動（新個体スポーン）

### ログファイル
- `/opt/minecraft_forge_server/logs/daily-evolution.log` - 実行ログ
- `/opt/minecraft_forge_server/logs/auto-evolution.log` - 進化サイクル詳細ログ

### 設定変更
実行時間を変更したい場合は、crontabの時間部分を編集：
```bash
# 例：毎日午前2時に変更
0 2 * * * /bin/bash /opt/minecraft_forge_server/ailife-scripts/daily-evolution.sh >> /opt/minecraft_forge_server/logs/daily-evolution.log 2>&1

# 例：12時間ごと（午前3時と午後3時）
0 3,15 * * * /bin/bash /opt/minecraft_forge_server/ailife-scripts/daily-evolution.sh >> /opt/minecraft_forge_server/logs/daily-evolution.log 2>&1
```

---

## よくある質問

- **Q. EMF/ETFはどこで入手？**
  - A. 上記「必要環境」または「クイックスタート」のURLから正しいバージョンをDLし、`mods/`に配置してください。
- **Q. JDKのバージョンが違うとビルドできない？**
  - A. 必ずJDK 17を使用してください。
- **Q. サーバー起動時にMODが認識されない**
  - A. Forgeプロファイルで起動し、MOD/依存MODのバージョンを揃えてください。
- **Q. VPSでNode.jsスクリプトが正しいパスを参照しない**
  - A. `NODE_ENV=production`が設定されているか確認してください。`echo $NODE_ENV`で確認できます。
- **Q. 特性データ（behavior, sociality, lifespan）が読み込まれない**
  - A. Java MODが5.1.4以降で、Node.jsスクリプトが5.1.2拡張版であることを確認してください。

---

## ライセンス

MIT License

---

## 問い合わせ

バグ報告・要望はGitHub Issueまたはチャットでご連絡ください。 