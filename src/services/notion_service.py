from datetime import datetime
from src.config.notion import notion, DATABASE_PROPERTIES, PARENT_PAGE_ID
import requests
import os
from src.services.s3_service import S3Service
import logging

logging.basicConfig(level=logging.DEBUG)

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
            print(f"[DEBUG] create_article_if_not_exists: query response: {response}")

            # 記事が存在しない場合は作成
            if not response["results"]:
                create_resp = notion.pages.create(
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
                print(f"[DEBUG] create_article_if_not_exists: create response: {create_resp}")
                return True
            return False
        except Exception as e:
            print(f"[DEBUG] create_article_if_not_exists: error: {str(e)}")
            raise Exception(f"記事の作成に失敗しました: {str(e)}")

    @staticmethod
    def update_article(database_id, title, content):
        print('update_article reached')
        try:
            print(f"[DEBUG] update_article: database_id: {database_id}, title: {title}, content: {content}")
            response = notion.databases.query(
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
                resp = notion.blocks.children.append(
                    block_id=page_id,
                    children=[{
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [
                                {"type": "text", "text": {"content": content}}
                            ]
                        }
                    }]
                )
                print(f"[DEBUG] update_article: append response: {resp}")
                return True
            return False
        except Exception as e:
            print(f"update_article error: {str(e)}")
            raise Exception(f"記事の更新に失敗しました: {str(e)}")

    @staticmethod
    def upload_image_to_notion(page_id, image_path, caption=None):
        """
        画像をNotionページにアップロードします
        
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
            response = notion.blocks.children.append(
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

    @staticmethod
    def add_image_to_article(database_id, title, image_path, caption=None):
        """
        指定されたタイトルの記事に画像を追加します
        
        Args:
            database_id (str): NotionデータベースのID
            title (str): 記事のタイトル
            image_path (str): アップロードする画像のパス
            caption (str, optional): 画像のキャプション
            
        Returns:
            bool: 画像の追加が成功したかどうか
        """
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
            print(f"[DEBUG] add_image_to_article: query response: {response}")

            # 記事が存在しない場合は作成
            if not response["results"]:
                NotionService.create_article_if_not_exists(
                    database_id=database_id,
                    title=title,
                    content="今日の記事です。"
                )
                # 作成した記事を再検索
                response = notion.databases.query(
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
                return NotionService.upload_image_to_notion(page_id, image_path, caption)
            
            raise Exception("記事の作成に失敗しました")
            
        except Exception as e:
            error_msg = f"記事への画像追加に失敗しました: {str(e)}"
            print(f"[DEBUG] add_image_to_article: error: {error_msg}")
            raise Exception(error_msg)