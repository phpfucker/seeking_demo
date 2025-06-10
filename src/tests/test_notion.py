import unittest
import os
from datetime import datetime
from PIL import Image
from src.services.notion_service import NotionService

class TestNotionService(unittest.TestCase):
    def setUp(self):
        self.notion_service = NotionService()
        self.test_dir = os.path.join(os.path.dirname(__file__), "test_files")
        os.makedirs(self.test_dir, exist_ok=True)

    def test_daily_report_update(self):
        """当日日付の記事への追記テスト"""
        try:
            # テスト用のダミーデータ
            today = datetime.now().strftime("%Y-%m-%d")
            dummy_content = f"これは{today}のテスト追記です。"
            dummy_image_path = os.path.join(self.test_dir, "dummy.png")

            # ダミー画像ファイルを作成
            if not os.path.exists(dummy_image_path):
                img = Image.new('RGB', (64, 64), color=(200, 200, 200))
                img.save(dummy_image_path)

            # 記事がなければ作成
            self.notion_service.create_article_if_not_exists(
                self.notion_service.database_id,
                today,
                dummy_content
            )

            # 本文に追記
            self.notion_service.update_article(
                self.notion_service.database_id,
                today,
                f"追記テキスト: {dummy_content}"
            )

            # 画像も追記
            response = self.notion_service.client.databases.query(
                database_id=self.notion_service.database_id,
                filter={"property": "Title", "title": {"equals": today}}
            )
            assert response["results"], "記事が見つかりませんでした"
            page_id = response["results"][0]["id"]
            self.notion_service.upload_image_to_notion(page_id, dummy_image_path)

            print(f"Notionへの保存完了: {page_id}")
            print("\nテスト完了: 当日日付の記事への追記が正常に実行されました")

        except Exception as e:
            self.fail(f"テスト中にエラーが発生しました: {str(e)}")

if __name__ == '__main__':
    unittest.main() 