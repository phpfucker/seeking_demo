# Seekin Demo

Notionと連携した記事管理・画像自動貼り付けアプリケーション

## 概要

このアプリケーションは、ChatGPTでストーリーを生成し、Stable Diffusionで漫画画像を生成、S3に保存し、Notionにストーリーや画像を自動で貼り付ける自動化フローを提供します。
Python + Docker + Flask構成で、API経由で日報や画像をNotionに自動追記できます。

## システム構成
- ChatGPTでストーリー生成
- Stable Diffusionで漫画画像生成
- S3に画像保存
- Notionにストーリーや画像を自動で貼り付け
- すべてPython/Docker/Flaskで自動化

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
- `NOTION_TOKEN`: Notionのインテグレーショントークン
- `NOTION_PAGE_ID`: NotionのデータベースID
- `OPENAI_API_KEY`: OpenAI APIキー
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`: S3用

3. Dockerコンテナの起動
```bash
docker-compose up -d
```

## 運用フロー

1. ChatGPTでストーリー生成
2. Stable Diffusionでコマごとに漫画画像生成
3. 画像をS3にアップロード
4. Notionにストーリー本文・画像を自動貼り付け

## APIエンドポイント

### 日報・記事の追記
```http
POST /update-article
```
- 指定したタイトル（例：日付）ページに本文を追記します
- タイトルが一致するページがない場合は何も追記されません

#### サンプルリクエスト
```bash
curl -X POST http://localhost:3000/update-article -H "Content-Type: application/json" -d @report.json
```

#### report.json サンプル
```json
{
  "title": "2025-06-08",
  "content": "本日の作業まとめ..."
}
```

### 画像追加API
（省略。必要に応じて add_image_to_article エンドポイントを追記してください）

## 開発・運用のポイント
- タイトル（title）はNotion上のページと完全一致させてください
- 画像追加・テキスト追記のAPIはDockerコンテナ起動後すぐ利用可能です
- 主要な自動化フローは `test_story_to_notion.py` などで一括テストできます

## 参考
- Notion API: https://developers.notion.com/
- OpenAI API: https://platform.openai.com/
- Stable Diffusion: https://github.com/CompVis/stable-diffusion

---

本READMEは2025年6月時点の運用フローに基づいています。 