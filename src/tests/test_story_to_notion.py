import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# プロジェクトのルートディレクトリをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.services.manga_generator import MangaGenerator

# 環境変数の読み込み
load_dotenv()

BASE_URL = "http://localhost:3000"
UPLOADS_DIR = Path("uploads")
FILENAME = "story1_page1.png"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

UPLOADS_DIR.mkdir(exist_ok=True)

# OpenAI APIクライアントの初期化
client = OpenAI(api_key=OPENAI_API_KEY)

def generate_story():
    """ストーリーを生成する"""
    print("1. ストーリー生成...")
    res = requests.post(f"{BASE_URL}/generate-story")
    res.raise_for_status()
    story = res.json()["story"]
    print(story)
    return story

def generate_manga_image(story):
    """ストーリーから漫画画像を生成する"""
    print("2. 漫画画像を生成中...")
    
    # MangaGeneratorの初期化
    generator = MangaGenerator()
    
    # ストーリーの最初の部分をプロンプトとして使用
    prompt = story.split('\n')[0]  # 最初の行を使用
    
    # 画像生成
    image = generator.generate_manga_page(
        prompt=prompt,
        negative_prompt="low quality, blurry, distorted",
        num_inference_steps=30,
        guidance_scale=7.5
    )
    
    # 画像を保存
    image_path = UPLOADS_DIR / FILENAME
    generator.save_image(image, str(image_path))
    
    print(f"画像を保存しました: {image_path}")
    return FILENAME

def upload_to_s3(filename):
    """画像をS3にアップロードする"""
    print("3. S3にアップロード中...")
    res = requests.post(f"{BASE_URL}/upload-to-s3", json={"filename": filename})
    res.raise_for_status()
    s3_url = res.json()["s3_url"]
    print("S3 URL:", s3_url)
    return s3_url

def add_image_to_notion(filename):
    """画像をNotionに追加する"""
    print("4. Notionに画像を保存中...")
    res = requests.post(f"{BASE_URL}/add-image-to-notion", json={"filename": filename})
    res.raise_for_status()
    print("Notion連携完了:", res.json())

def main():
    """メイン処理"""
    try:
        # 1. ストーリー生成
        story = generate_story()
        
        # 2. 漫画画像生成
        filename = generate_manga_image(story)
        
        # 3. S3アップロード
        upload_to_s3(filename)
        
        # 4. Notion連携
        add_image_to_notion(filename)
        
    except Exception as e:
        print(f"エラーが発生しました: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 