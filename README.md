# Seekin Demo

Notionと連携した記事管理アプリケーション

## 概要

このアプリケーションは、Notionのデータベースと連携して記事を管理するためのAPIを提供します。
Flask + PostgreSQL + Notionの構成で、Dockerコンテナとして動作します。

## 機能

- Notionデータベースの自動作成
- 日付ベースの記事自動作成
- 記事のCRUD操作（作成・読み取り・更新・削除）

## 技術スタック

- Backend: Python 3.11 + Flask
- Database: PostgreSQL 14
- External API: Notion API
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

## 開発環境のセットアップ

1. Notionインテグレーションの作成
   - [Notion Developers](https://developers.notion.com/)にアクセス
   - 新しいインテグレーションを作成
   - インテグレーショントークンを取得

2. Notionページの設定
   - 新しいページを作成
   - ページのURLからIDを取得（例：`https://www.notion.so/workspace/1234567890abcdef` の場合、`1234567890abcdef`がID）
   - インテグレーションをページに接続（ページの「...」メニュー → 「コネクション」）

3. 環境変数の設定
   - `.env.example`をコピーして`.env`を作成
   - 取得したトークンとページIDを設定

## 注意事項

- `.env`ファイルはGitで管理されません。機密情報を含むため、ローカル環境でのみ管理してください。
- Notionのインテグレーショントークンは適切な権限（Contents）を付与してください。
- データベースの作成には、ページへの適切なアクセス権限が必要です。 