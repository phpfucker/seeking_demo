# -*- coding: utf-8 -*-

import os
import sys
from dotenv import load_dotenv

# プロジェクトのルートディレクトリをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.services.manga_improver import MangaImprover

# 環境変数の読み込み
load_dotenv()

def test_prompt_improvement():
    # 元プロンプト
    original_prompt = "anime style, colorful, friendly animals, beautiful forest, unity, warmth, expressive faces, soft lighting, safe content, high quality"

    # 直前の分析結果（イラスト用の例）
    analysis = '''1. メインサブジェクトとキャラクター: キャラクターの表情がやや曖昧で、個性が伝わりにくい。\n2. 森の背景や雰囲気: 背景のディテールが少なく、森の雰囲気が弱い。\n3. 色彩やスタイル: 色使いは明るいが、全体のトーンがやや単調。\n4. 技術的な品質: 構図はバランスが良いが、細部の描写が甘い。\n5. 改善点: キャラクターの個性を強調し、背景の森をより詳細に描写し、色彩にバリエーションを持たせると良い。'''

    improver = MangaImprover()
    improved_prompt = improver._extract_improved_prompt(analysis, original_prompt)

    print("\n--- 改善されたプロンプト ---\n")
    print(improved_prompt)

if __name__ == "__main__":
    test_prompt_improvement() 