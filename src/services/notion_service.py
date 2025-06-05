from datetime import datetime
from config.notion import notion, DATABASE_PROPERTIES, PARENT_PAGE_ID

class NotionService:
    @staticmethod
    def create_database_if_not_exists():
        """データベースが存在しない場合は作成する"""
        try:
            # 新しいデータベースを作成
            database = notion.databases.create(
                parent={"type": "page_id", "page_id": PARENT_PAGE_ID},
                title=[{"type": "text", "text": {"content": "Seekin Demo"}}],
                properties=DATABASE_PROPERTIES
            )
            return database["id"]
        except Exception as e:
            raise Exception(f"データベースの作成に失敗しました: {str(e)}")

    @staticmethod
    def create_article_if_not_exists(database_id, title, content):
        """指定されたタイトルの記事が存在しない場合は作成する"""
        try:
            # データベース内の記事を検索
            response = notion.databases.query(
                database_id=database_id,
                filter={
                    "property": "title",
                    "title": {
                        "equals": title
                    }
                }
            )

            # 記事が存在しない場合は作成
            if not response["results"]:
                notion.pages.create(
                    parent={"database_id": database_id},
                    properties={
                        "title": {
                            "title": [
                                {
                                    "text": {
                                        "content": title
                                    }
                                }
                            ]
                        },
                        "content": {
                            "rich_text": [
                                {
                                    "text": {
                                        "content": content
                                    }
                                }
                            ]
                        },
                        "created_at": {
                            "date": {
                                "start": datetime.now().isoformat()
                            }
                        }
                    }
                )
                return True
            return False
        except Exception as e:
            raise Exception(f"記事の作成に失敗しました: {str(e)}") 