from flask import Flask
import os
import psycopg2

app = Flask(__name__)

@app.route("/")
def hello():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute("SELECT NOW()")
    now = cur.fetchone()[0]
    cur.close()
    conn.close()
    return f"Hello, world!<br>DB Time: {now}"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000) 