# Seekin Demo

Notionと連携した記事管理・イラスト自動生成アプリケーション

## 概要

このアプリケーションは、ChatGPTでストーリーを生成し、Stable Diffusionでイラストを生成、S3に保存し、Notionにストーリーやイラストを自動で貼り付ける自動化フローを提供します。
Python + Docker + Flask構成で、API経由で日報やイラストをNotionに自動追記できます。

## システム構成
- ChatGPTでストーリー生成
- Stable Diffusionでイラスト生成
- S3に画像保存
- Notionにストーリーやイラストを自動で貼り付け
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

## テスト実行

一連の処理（ストーリー生成→イラスト生成→S3アップロード→Notion連携）をテスト実行するには：

```bash
docker-compose exec app python src/tests/test_story_to_notion.py
```

このコマンドで以下の処理が自動実行されます：
1. ChatGPTでストーリーを生成
2. Stable Diffusionでイラストを生成
3. 生成したイラストをS3にアップロード
4. Notionにストーリーとイラストを自動貼り付け

## 運用フロー

1. ChatGPTでストーリー生成
2. Stable Diffusionでイラスト生成
3. イラストをS3にアップロード
4. Notionにストーリー本文・イラストを自動貼り付け

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
```http
POST /add-image-to-article
```
- 指定したタイトルのページに画像を追加します
- 画像はS3にアップロードされ、Notionページに追記されます

## 開発・運用のポイント
- タイトル（title）はNotion上のページと完全一致させてください
- 画像追加・テキスト追記のAPIはDockerコンテナ起動後すぐ利用可能です
- 主要な自動化フローは `test_story_to_notion.py` で一括テストできます
- イラスト生成はStable Diffusionを使用し、NSFWフィルターを適用しています

## 参考
- Notion API: https://developers.notion.com/
- OpenAI API: https://platform.openai.com/
- Stable Diffusion: https://github.com/CompVis/stable-diffusion

---

本READMEは2025年6月時点の運用フローに基づいています。 