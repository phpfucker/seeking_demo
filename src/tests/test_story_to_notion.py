# -*- coding: utf-8 -*-

import os
import sys
import unittest
import requests
import json
from dotenv import load_dotenv
from pathlib import Path
from PIL import Image
from datetime import datetime
import logging
from openai import OpenAI

# プロジェクトのルートディレクトリをPythonパスに追加
project_root = str(Path(__file__).parent.parent.parent)
sys.path.append(project_root)

from src.services.manga_generator import MangaGenerator
from src.services.manga_improver import MangaImprover
from src.services.notion_service import NotionService
from src.services.story_splitter import StorySplitter

# ログ設定
def setup_logger():
    # ログディレクトリの作成
    log_dir = Path("src/data/log")
    log_dir.mkdir(exist_ok=True)
    
    # ログファイル名の設定（日時を含む）
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"test_story_to_notion_{timestamp}.log"
    
    # ロガーの設定
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)
    
    # ファイルハンドラの設定
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    
    # コンソールハンドラの設定
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # フォーマッタの設定
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # ハンドラの追加
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

class TestStoryToNotion(unittest.TestCase):
    def setUp(self):
        load_dotenv()
        self.logger = setup_logger()
        self.logger.info("テストを開始します")
        self.manga_generator = MangaGenerator()
        self.manga_improver = MangaImprover()
        self.notion_service = NotionService()
        self.story_splitter = StorySplitter()
        self.base_url = "http://localhost:3000"
        
        # 画像保存先をsrc/data/imgディレクトリに変更
        self.test_dir = os.path.join(project_root, "src", "data", "img")
        os.makedirs(self.test_dir, exist_ok=True)
    
    def test_full_flow(self):
        """ストーリー生成からNotion連携までの一連のフローをテスト（イラスト専用）"""
        try:
            self.logger.info("1. ストーリー生成を開始...")
            response = requests.post(
                f"{self.base_url}/generate-story",
                json={"prompt": "テスト用のストーリーを生成してください"}
            )
            response.raise_for_status()
            story_data = response.json()
            
            # generation_processが存在しない場合はデフォルト値を設定
            generation_process = story_data.get("generation_process", "生成プロセスの詳細は利用できません。")
            
            story = story_data["story"]
            self.assertIsNotNone(story)
            self.assertIsNotNone(generation_process)
            self.logger.info("ストーリー生成完了")
            
            self.logger.info("2. ストーリーをイラスト用プロンプトに変換...")
            prompt, explanation = self.story_splitter.convert_to_illustration_prompt(story)
            self.logger.info("イラスト用プロンプト:")
            self.logger.info(prompt)
            
            self.logger.info("3. イラスト生成を開始...")
            image = self.manga_generator.generate_illustration(
                prompt,
                num_inference_steps=5,
                guidance_scale=3.0,
                image_size=(512, 512),
                negative_prompt="blurry, low quality, low resolution, deformed, disfigured, bad anatomy, ugly, bad proportions, extra limbs, NSFW, inappropriate content"
            )
            manga_path = os.path.join(self.test_dir, "test_illustration.png")
            self.manga_generator.save_image(image, manga_path)
            self.assertIsNotNone(manga_path)
            self.assertTrue(os.path.exists(manga_path))
            self.logger.info("イラスト生成完了")
            
            self.logger.info("4. 画像分析とプロンプト改善を開始...")
            improved_prompt, analysis = self.manga_improver.analyze_and_improve(manga_path, prompt)
            self.assertIsNotNone(improved_prompt)
            self.logger.info("画像分析とプロンプト改善完了")
            
            # ストーリーとイラストをstory記事に保存
            story_content = f"""
## 生成されたストーリー
{story}

## 生成されたイラスト
"""
            self.logger.info("5. ストーリーとイラストをstory記事に保存...")
            story_page_id = self.notion_service.create_page(
                title="story",
                content=story_content,
                image_path=manga_path
            )
            self.assertIsNotNone(story_page_id)
            self.logger.info(f"ストーリーとイラストの保存完了: {story_page_id}")
            
            # 分析レポートをDaily Reportテーブルに保存
            daily_report = f"""
## 生成レポート
### ストーリー生成プロセス
{generation_process}

### イラスト生成プロセス
{prompt}
"""
            self.logger.info("6. 生成レポートをDaily Reportテーブルに保存...")
            report_page_id = self.notion_service.create_page(
                title=datetime.now().strftime("%Y-%m-%d"),
                content=daily_report
            )
            self.assertIsNotNone(report_page_id)
            self.logger.info(f"生成レポートの保存完了: {report_page_id}")
            
            self.logger.info("テスト完了: すべての処理が正常に実行されました")
        except Exception as e:
            self.logger.error(f"テスト中にエラーが発生しました: {str(e)}")
            raise
    
    def tearDown(self):
        # uploadsディレクトリは削除しない（ホストから閲覧できるようにするため）
        pass

if __name__ == "__main__":
    unittest.main() 