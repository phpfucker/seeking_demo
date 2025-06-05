from datetime import datetime
from config.notion import notion, DATABASE_PROPERTIES, PARENT_PAGE_ID
import requests

class NotionService:
    @staticmethod
    def create_database_if_not_exists():
        """データベースが存在しない場合は作成する"""
        try:
            # 新しいデータベースを作成
            database = notion.databases.create(
                parent={"type": "page_id", "page_id": PARENT_PAGE_ID},
                title=[{"type": "text", "text": {"content": "Daily Report"}}],
                properties={
                    "Title": {
                        "title": {}
                    },
                    "Date": {
                        "date": {}
                    },
                    "Content": {
                        "rich_text": {}
                    },
                    "Created At": {
                        "date": {}
                    }
                }
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
                    "property": "Title",
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
                        "Title": {
                            "title": [
                                {
                                    "text": {
                                        "content": title
                                    }
                                }
                            ]
                        },
                        "Content": {
                            "rich_text": [
                                {
                                    "text": {
                                        "content": content
                                    }
                                }
                            ]
                        },
                        "Created At": {
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

    @staticmethod
    def update_article(database_id, title, content):
        """指定されたタイトルの記事を更新する（本文もマークダウンで上書き）"""
        try:
            # データベース内の記事を検索
            response = notion.databases.query(
                database_id=database_id,
                filter={
                    "property": "Title",
                    "title": {
                        "equals": title
                    }
                }
            )

            # 記事が存在する場合は更新
            if response["results"]:
                page_id = response["results"][0]["id"]
                # プロパティの更新
                notion.pages.update(
                    page_id=page_id,
                    properties={
                        "Content": {
                            "rich_text": [
                                {
                                    "text": {
                                        "content": content
                                    }
                                }
                            ]
                        }
                    }
                )

                # --- 本文（ブロック）をマークダウンで上書き ---
                # 既存ブロックの取得
                children = notion.blocks.children.list(page_id)["results"]
                # 既存ブロックを全削除
                for block in children:
                    notion.blocks.delete(block["id"])

                # マークダウン→Notionブロック変換
                def md_to_blocks(md):
                    blocks = []
                    for line in md.split("\n"):
                        line = line.strip()
                        if not line:
                            continue
                        if line.startswith("# "):
                            blocks.append({"object": "block", "type": "heading_1", "heading_1": {"rich_text": [{"type": "text", "text": {"content": line[2:]}}]}})
                        elif line.startswith("## "):
                            blocks.append({"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": line[3:]}}]}})
                        elif line.startswith("### "):
                            blocks.append({"object": "block", "type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": line[4:]}}]}})
                        elif line.startswith("- "):
                            blocks.append({"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": line[2:]}}]}})
                        else:
                            blocks.append({"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": line}}]}})
                    return blocks

                new_blocks = md_to_blocks(content)
                # 新しいブロックを追加
                if new_blocks:
                    notion.blocks.children.append(page_id, children=new_blocks)
                return True
            return False
        except Exception as e:
            raise Exception(f"記事の更新に失敗しました: {str(e)}")