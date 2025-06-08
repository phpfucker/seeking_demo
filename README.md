# Seekin Demo

Notionと連携した記事管理アプリケーション

## 概要

このアプリケーションは、Notionのデータベースと連携して記事を管理するためのAPIを提供します。
Flask + PostgreSQL + Notionの構成で、Dockerコンテナとして動作します。
また、OpenAIのDALL·E APIを使用した画像生成機能も提供しています。

## 機能

- Notionデータベースの自動作成
- 日付ベースの記事自動作成
- 記事のCRUD操作（作成・読み取り・更新・削除）
- OpenAI DALL·Eを使用した画像生成

## 技術スタック

- Backend: Python 3.11 + Flask
- Database: PostgreSQL 14
- External API: Notion API, OpenAI API (DALL·E)
- Container: Docker + Docker Compose

## セットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/phpfucker/seeking_demo.git
cd seeking_demo
```

2. 環境変数の設定
`.env.example`をコピーして`.env`を作成し、必要な値を設定します：
```bash
cp .env.example .env
```

必要な環境変数：
- `GITHUB_TOKEN`: GitHubのPersonal Access Token
- `NOTION_TOKEN`: Notionのインテグレーショントークン
- `NOTION_PAGE_ID`: NotionのページID（データベースを作成するページのID）
- `OPENAI_API_KEY`: OpenAI APIキー（画像生成機能用）

3. Dockerコンテナの起動
```bash
docker-compose up -d
```

## APIエンドポイント

### Notionデータベースの初期化
```http
POST /init-notion
```
- Notionデータベースを作成
- 今日の日付の記事を作成

### 記事の操作
```http
GET /articles
POST /articles
GET /articles/<id>
PUT /articles/<id>
DELETE /articles/<id>
```

## 画像生成機能

### 使用方法

```python
from services.image_generator import ImageGenerator

# インスタンスの作成
generator = ImageGenerator()

# 画像の生成と保存
prompt = "あなたのプロンプト"
saved_path = generator.generate_and_save_image(prompt)
```

### パラメータ

- `prompt`: 画像生成のためのプロンプト（必須）
- `size`: 画像サイズ（オプション）
  - "256x256"（デフォルト、最も安価）
  - "512x512"
  - "1024x1024"
- `filename`: 保存するファイル名（オプション、指定がない場合は自動生成）

### 料金について

OpenAI DALL·Eの料金は以下の要因で変動します：

1. 画像サイズ
   - 256x256: 最も安価
   - 512x512: 中程度
   - 1024x1024: 最も高価

2. 生成数
   - 一度に生成する画像数（1-10枚）

3. プロンプト
   - 短く、シンプルなプロンプトを使用することで、より効率的に生成できます

### 料金を抑えるためのヒント

1. 開発・テスト時は256x256サイズを使用
2. プロンプトは必要最小限に
3. 一度に1枚ずつ生成
4. テスト後に本番用のサイズに変更

## 開発環境のセットアップ

1. Notionインテグレーションの作成
   - [Notion Developers](https://developers.notion.com/)にアクセス
   - 新しいインテグレーションを作成
   - インテグレーショントークンを取得

2. Notionページの設定
   - 新しいページを作成
   - ページのURLからIDを取得（例：`https://www.notion.so/workspace/1234567890abcdef` の場合、`1234567890abcdef`がID）
   - インテグレーションをページに接続（ページの「...」メニュー → 「コネクション」）

3. OpenAI APIの設定
   - [OpenAI Platform](https://platform.openai.com/)にアクセス
   - APIキーを取得
   - 画像生成（DALL·E）の利用を有効化

4. 環境変数の設定
   - `.env.example`をコピーして`.env`を作成
   - 取得したトークンとページIDを設定

## 注意事項

- `.env`ファイルはGitで管理されません。機密情報を含むため、ローカル環境でのみ管理してください。
- Notionのインテグレーショントークンは適切な権限（Contents）を付与してください。
- データベースの作成には、ページへの適切なアクセス権限が必要です。
- OpenAI APIの利用には料金が発生します。開発時は256x256サイズを使用することを推奨します。
- 生成された画像は一時的なURLで提供され、一定時間後にアクセスできなくなります。 