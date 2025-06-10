from datetime import datetime
from src.config.notion import notion, DATABASE_PROPERTIES, PARENT_PAGE_ID
import requests
import os
from src.services.s3_service import S3Service
import logging
from notion_client import Client
from dotenv import load_dotenv

logging.basicConfig(level=logging.DEBUG)

class NotionService:
    def __init__(self):
        """NotionServiceの初期化"""
        load_dotenv()
        self.client = Client(auth=os.getenv("NOTION_TOKEN"))
        self.database_id = os.getenv("NOTION_DATABASE_ID")
        if not self.database_id:
            raise ValueError('NOTION_DATABASE_ID is not set in environment variables')
    
    def create_database_if_not_exists(self):
        """データベースが存在しない場合は作成する"""
        try:
            # 新しいデータベースを作成
            database = self.client.databases.create(
                parent={"type": "page_id", "page_id": os.getenv("NOTION_PAGE_ID")},
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

    def _split_text_blocks(self, text, max_length=2000):
        """テキストをmax_lengthごとに分割しリストで返す"""
        return [text[i:i+max_length] for i in range(0, len(text), max_length)]

    def _create_text_block(self, text: str) -> dict:
        """テキストブロックを作成する"""
        return {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {
                            "content": text
                        }
                    }
                ]
            }
        }

    def create_article_if_not_exists(self, database_id, title, content):
        try:
            response = self.client.databases.query(
                database_id=database_id,
                filter={
                    "property": "Title",
                    "title": {
                        "equals": title
                    }
                }
            )
            print(f"[DEBUG] create_article_if_not_exists: query response: {response}")

            if not response["results"]:
                create_resp = self.client.pages.create(
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
                        "Created At": {
                            "date": {
                                "start": datetime.now().isoformat()
                            }
                        }
                    }
                )
                # 本文（blocks）にテキストを追加
                if content:
                    blocks = [self._create_text_block(t) for t in self._split_text_blocks(content)]
                    for block in blocks:
                        self.client.blocks.children.append(
                            block_id=create_resp["id"],
                            children=[block]
                        )
                print(f"[DEBUG] create_article_if_not_exists: create response: {create_resp}")
                return True
            else:
                # 記事が存在する場合は上書き
                self.update_article(database_id, title, content)
                return True
        except Exception as e:
            print(f"[DEBUG] create_article_if_not_exists: error: {str(e)}")
            raise Exception(f"記事の作成に失敗しました: {str(e)}")

    def update_article(self, database_id, title, content):
        print('update_article reached')
        try:
            print(f"[DEBUG] update_article: database_id: {database_id}, title: {title}, content: {content}")
            response = self.client.databases.query(
                database_id=database_id,
                filter={
                    "property": "Title",
                    "title": {
                        "equals": title
                    }
                }
            )
            print(f"[DEBUG] update_article: query response: {response}")
            if response["results"]:
                page_id = response["results"][0]["id"]
                print(f"[DEBUG] update_article: page_id: {page_id}")
                blocks = [self._create_text_block(t) for t in self._split_text_blocks(content)]
                for block in blocks:
                    resp = self.client.blocks.children.append(
                        block_id=page_id,
                        children=[block]
                    )
                print(f"[DEBUG] update_article: append response: {resp}")
                return True
            return False
        except Exception as e:
            print(f"update_article error: {str(e)}")
            raise Exception(f"記事の更新に失敗しました: {str(e)}")

    def upload_image_to_notion(self, page_id, image_path, caption=None):
        """
        画像をNotionページにアップロードします（既存内容を消さずに追記）
        Args:
            page_id (str): NotionページのID
            image_path (str): アップロードする画像のパス
            caption (str, optional): 画像のキャプション
        Returns:
            bool: アップロードが成功したかどうか
        """
        try:
            # S3に画像をアップロードしてURLを取得
            image_url = S3Service.upload_image(image_path)
            print(f"[DEBUG] upload_image_to_notion: image_url: {image_url}")
            if not image_url:
                return False
            
            # 画像をNotionに追加
            response = self.client.blocks.children.append(
                block_id=page_id,
                children=[{
                    "object": "block",
                    "type": "image",
                    "image": {
                        "type": "external",
                        "external": {
                            "url": image_url
                        },
                        "caption": [{"type": "text", "text": {"content": caption or ""}}] if caption else []
                    }
                }]
            )
            print(f"[DEBUG] upload_image_to_notion: append response: {response}")
            return True
        except Exception as e:
            print(f"[DEBUG] upload_image_to_notion: error: {str(e)}")
            return False

    def create_page(self, title, content, image_path, analysis=None, report=None):
        """Notionにページを作成し、画像とレポートを添付する（本文は消さずに追記）
        既存ページがあればそのページに追記、新規なら作成
        """
        try:
            # 既存ページを検索
            response = self.client.databases.query(
                database_id=self.database_id,
                filter={
                    "property": "Title",
                    "title": {"equals": title}
                }
            )
            if response["results"]:
                # 既存ページがあれば本文に追記
                page_id = response["results"][0]["id"]
                if content:
                    blocks = [self._create_text_block(t) for t in self._split_text_blocks(content)]
                    for block in blocks:
                        self.client.blocks.children.append(
                            block_id=page_id,
                            children=[block]
                        )
                if image_path:
                    self.upload_image_to_notion(page_id, image_path)
                return page_id
            else:
                # なければ新規作成
                page = self.client.pages.create(
                    parent={"database_id": self.database_id},
                    properties={
                        "Title": {"title": [{"text": {"content": title}}]},
                        "Created At": {"date": {"start": datetime.now().isoformat()}}
                    }
                )
                if content:
                    blocks = [self._create_text_block(t) for t in self._split_text_blocks(content)]
                    for block in blocks:
                        self.client.blocks.children.append(
                            block_id=page["id"],
                            children=[block]
                        )
                if image_path:
                    self.upload_image_to_notion(page["id"], image_path)
                return page["id"]
        except Exception as e:
            print(f"Notionへの保存中にエラーが発生しました: {str(e)}")
            return None

    def add_image_to_article(self, database_id, title, image_path, caption=None):
        """
        指定されたタイトルの記事に画像を追加します
        """
        try:
            # データベース内の記事を検索
            response = self.client.databases.query(
                database_id=database_id,
                filter={
                    "property": "Title",
                    "title": {
                        "equals": title
                    }
                }
            )
            print(f"[DEBUG] add_image_to_article: query response: {response}")

            # 記事が存在しない場合は作成
            if not response["results"]:
                self.create_article_if_not_exists(
                    database_id=database_id,
                    title=title,
                    content="今日の記事です。"
                )
                # 作成した記事を再検索
                response = self.client.databases.query(
                    database_id=database_id,
                    filter={
                        "property": "Title",
                        "title": {
                            "equals": title
                        }
                    }
                )
                print(f"[DEBUG] add_image_to_article: re-query response: {response}")

            # 記事に画像を追加
            if response["results"]:
                page_id = response["results"][0]["id"]
                return self.upload_image_to_notion(page_id, image_path, caption)
            
            raise Exception("記事の作成に失敗しました")
            
        except Exception as e:
            error_msg = f"記事への画像追加に失敗しました: {str(e)}"
            print(f"[DEBUG] add_image_to_article: error: {error_msg}")
            raise Exception(error_msg)