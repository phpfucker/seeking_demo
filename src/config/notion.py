import os
from notion_client import Client

# Notionクライアントの初期化
notion = Client(auth=os.environ["NOTION_TOKEN"])

# データベースのプロパティ定義
DATABASE_PROPERTIES = {
    "title": {
        "title": {}
    },
    "content": {
        "rich_text": {}
    },
    "created_at": {
        "date": {}
    }
}

# データベースの作成に使用するページID
PARENT_PAGE_ID = os.environ["NOTION_PAGE_ID"] 