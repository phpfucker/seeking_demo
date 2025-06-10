# -*- coding: utf-8 -*-

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# プロジェクトのルートディレクトリをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.services.manga_improver import MangaImprover

# 環境変数の読み込み
load_dotenv()

def test_image_analysis(image_path):
    """画像分析とプロンプト改善のテスト（イラスト用）"""
    print(f"画像分析を開始: {image_path}")
    
    # MangaImproverの初期化
    improver = MangaImprover()
    
    # テスト用のプロンプト
    test_prompt = "anime style, colorful, friendly animals, beautiful forest, unity, warmth, expressive faces, soft lighting, safe content, high quality"
    
    # 画像分析とプロンプト改善
    improved_prompt, analysis = improver.analyze_and_improve(image_path, test_prompt)
    
    print("\n改善されたプロンプト:")
    print(improved_prompt)
    
    print("\n分析結果:")
    print(analysis)

if __name__ == "__main__":
    # テスト用の画像パス
    image_path = "uploads/20250609_010833_story1_page1 2.png"
    
    # 画像分析テスト実行
    test_image_analysis(image_path) 