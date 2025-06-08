print('Flask app started')
from flask import Flask, request, jsonify, send_from_directory
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from src.services.notion_service import NotionService
from werkzeug.utils import secure_filename
from src.services.s3_service import S3Service
from src.config.s3 import *
import openai

app = Flask(__name__)

# 画像アップロード用の設定
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# アップロードフォルダの作成
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 画像アップロード用のエンドポイント
@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({"error": "ファイルがありません"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "ファイルが選択されていません"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # 画像URLを返す
        image_url = f"/images/{filename}"
        return jsonify({
            "message": "画像のアップロードが完了しました",
            "image_url": image_url
        })
    
    return jsonify({"error": "許可されていないファイル形式です"}), 400

# 画像ファイルを提供するエンドポイント
@app.route('/images/<filename>')
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# データベース接続
def get_db_connection():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.cursor_factory = RealDictCursor
    return conn

# NotionデータベースIDを取得
def get_notion_database_id():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT database_id FROM notion_settings ORDER BY id DESC LIMIT 1")
            result = cur.fetchone()
            return result['database_id'] if result else None
    finally:
        conn.close()

# NotionデータベースIDを保存
def save_notion_database_id(database_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO notion_settings (database_id) VALUES (%s) RETURNING id",
                (database_id,)
            )
            conn.commit()
    finally:
        conn.close()

# Notionデータベースの初期化
@app.route("/init-notion", methods=["POST"])
def init_notion():
    try:
        # データベースの作成
        database_id = NotionService.create_database_if_not_exists()
        
        # データベースIDを保存
        save_notion_database_id(database_id)
        
        # 今日の日付の記事を作成
        today = datetime.now().strftime("%Y-%m-%d")
        NotionService.create_article_if_not_exists(
            database_id=database_id,
            title=today,
            content="今日の記事です。"
        )
        
        return jsonify({
            "message": "Notionデータベースと記事の初期化が完了しました",
            "database_id": database_id
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 記事一覧の取得
@app.route("/articles", methods=["GET"])
def get_articles():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM articles ORDER BY created_at DESC")
    articles = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(articles)

# 記事の作成
@app.route("/articles", methods=["POST"])
def create_article():
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO articles (title, content) VALUES (%s, %s) RETURNING *",
        (data["title"], data["content"])
    )
    article = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return jsonify(article), 201

# 記事の取得
@app.route("/articles/<int:article_id>", methods=["GET"])
def get_article(article_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM articles WHERE id = %s", (article_id,))
    article = cur.fetchone()
    cur.close()
    conn.close()
    if article is None:
        return jsonify({"error": "Article not found"}), 404
    return jsonify(article)

# 記事の更新
@app.route("/articles/<int:article_id>", methods=["PUT"])
def update_article(article_id):
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE articles SET title = %s, content = %s WHERE id = %s RETURNING *",
        (data["title"], data["content"], article_id)
    )
    article = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if article is None:
        return jsonify({"error": "Article not found"}), 404
    return jsonify(article)

# 記事の削除
@app.route("/articles/<int:article_id>", methods=["DELETE"])
def delete_article(article_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM articles WHERE id = %s RETURNING *", (article_id,))
    article = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if article is None:
        return jsonify({"error": "Article not found"}), 404
    return jsonify(article)

@app.route('/update-article', methods=['POST'])
def update_notion_article():
    print('call update_article')
    try:
        # データベースIDを取得
        database_id = get_notion_database_id()
        if not database_id:
            return jsonify({"error": "Notionデータベースが初期化されていません"}), 400

        data = request.get_json()
        title = data.get('title')
        content = data.get('content')
        
        if not title or not content:
            return jsonify({"error": "タイトルと内容は必須です"}), 400

        NotionService.update_article(database_id, title, content)
        
        return jsonify({
            "message": "記事の更新が完了しました"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/upload-to-s3', methods=['POST'])
def upload_to_s3():
    data = request.get_json()
    filename = data.get('filename')
    if not filename:
        return jsonify({"error": "filenameは必須です"}), 400
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "指定されたファイルが存在しません"}), 404
    
    # S3にアップロード
    s3_url = S3Service.upload_image(file_path)
    if not s3_url:
        return jsonify({"error": "S3へのアップロードに失敗しました"}), 500
    
    return jsonify({
        "message": "S3へのアップロードが完了しました",
        "s3_url": s3_url
    })

@app.route('/add-image-to-notion', methods=['POST'])
def add_image_to_notion():
    data = request.get_json()
    filename = data.get('filename')
    if not filename:
        return jsonify({"error": "filenameは必須です"}), 400
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "指定されたファイルが存在しません"}), 404
    
    try:
        # データベースIDを取得
        database_id = get_notion_database_id()
        if not database_id:
            # データベースが存在しない場合は作成
            database_id = NotionService.create_database_if_not_exists()
            save_notion_database_id(database_id)
        
        # 今日の日付の記事を作成または取得
        today = datetime.now().strftime("%Y-%m-%d")
        
        # S3に画像をアップロード
        s3_url = S3Service.upload_image(file_path)
        if not s3_url:
            return jsonify({"error": "S3へのアップロードに失敗しました"}), 500
        
        # 記事に画像を追加
        try:
            NotionService.add_image_to_article(
                database_id=database_id,
                title=today,
                image_path=file_path,
                caption=f"Generated image for {today}"
            )
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
        return jsonify({
            "message": "Notionへの画像追加が完了しました",
            "s3_url": s3_url
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

STORY_PROMPT_PATH = os.path.join(os.path.dirname(__file__), 'prompts', 'story_prompt.txt')

@app.route('/generate-story', methods=['POST'])
def generate_story():
    try:
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        with open(STORY_PROMPT_PATH, 'r', encoding='utf-8') as f:
            STORY_PROMPT = f.read()
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "あなたは優秀な漫画原作者です。"},
                {"role": "user", "content": STORY_PROMPT}
            ],
            max_tokens=1500,
            temperature=0.8
        )
        story = response.choices[0].message.content.strip()
        return jsonify({"story": story})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 3000)), debug=True) 