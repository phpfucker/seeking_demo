from flask import Flask, request, jsonify
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from services.notion_service import NotionService

app = Flask(__name__)

# データベース接続
def get_db_connection():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.cursor_factory = RealDictCursor
    return conn

# Notionデータベースの初期化
@app.route("/init-notion", methods=["POST"])
def init_notion():
    try:
        # データベースの作成
        database_id = NotionService.create_database_if_not_exists()
        
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000) 