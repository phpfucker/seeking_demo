#!/bin/bash
set -e

# .envファイルの自動読み込み
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# 必要な環境変数
if [ -z "$OPENAI_API_KEY" ]; then
  echo "OPENAI_API_KEYが設定されていません" >&2
  exit 1
fi

BASE_URL="http://localhost:3000"
UPLOADS_DIR="uploads"
FILENAME="story1_page1.png"

mkdir -p "$UPLOADS_DIR"

# 1. ストーリー生成
echo "1. ストーリー生成..."
story=$(curl -s -X POST $BASE_URL/generate-story | jq -r .story)
echo "$story"

# 2. 画像プロンプト生成
cat <<EOF > /tmp/prompt.txt
次のストーリーを1ページの漫画のイメージとして描写してください。絵の構図や雰囲気、登場キャラの特徴が伝わるように英語で詳細なプロンプトを作ってください。

$story
EOF

image_prompt=$(curl -s https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "system", "content": "You are a prompt engineer for AI art."},
    {"role": "user", "content": "$(cat /tmp/prompt.txt)"}
  ],
  "max_tokens": 300,
  "temperature": 0.7
}
JSON
 | jq -r .choices[0].message.content)
echo "画像生成プロンプト: $image_prompt"

# 3. 画像生成（DALL·E）
image_url=$(curl -s https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "prompt": "$image_prompt",
  "n": 1,
  "size": "1024x1024"
}
JSON
 | jq -r .data[0].url)
echo "画像URL: $image_url"

# 画像ダウンロード
curl -s -o "$UPLOADS_DIR/$FILENAME" "$image_url"
echo "画像を保存: $UPLOADS_DIR/$FILENAME"

# 4. S3アップロード
s3_url=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"filename": "'$FILENAME'"}' \
  $BASE_URL/upload-to-s3 | jq -r .s3_url)
echo "S3 URL: $s3_url"

# 5. Notion連携
notion_result=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"filename": "'$FILENAME'"}' \
  $BASE_URL/add-image-to-notion)
echo "Notion連携結果: $notion_result" 