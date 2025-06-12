print("DEBUG: main.py started.")
import os
import sys
import logging
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# プロジェクトのルートディレクトリをPythonパスに追加
# main.pyがsrcディレクトリ直下にあるため、project_rootは現在のファイルからの相対パスでsrcの親ディレクトリになる
project_root = str(Path(__file__).parent.parent.parent)
sys.path.append(project_root)

from src.services.story_generator import StoryGenerator
from src.services.story_splitter import StorySplitter
from src.services.image_generator import ImageGenerator
from src.services.notion_service import NotionService
# from src.services.manga_improver import MangaImprover # 今回は使用しないためコメントアウト

# story_idとnotion_page_idの保存ファイルパス
STATE_FILE = Path("src/data/state.json")

# ログ設定
def setup_logger():
    log_dir = Path("src/data/log")
    log_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"daily_story_run_{timestamp}.log"
    
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

def load_state():
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            logger.warning("state.jsonの読み込みに失敗しました。新しい状態を作成します。")
    return {"story_id": None, "notion_page_id": None, "part_number": 0}

def save_state(state):
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f)
    logger.info(f"状態を保存しました: {state}")

def main():
    logger = setup_logger()
    logger.info("日次ストーリー生成とNotion連携プロセスを開始します")
    load_dotenv()

    # サービスの初期化
    story_generator = StoryGenerator()
    story_splitter = StorySplitter()
    image_generator = ImageGenerator()
    notion_service = NotionService()
    # manga_improver = MangaImprover() # 今回は使用しないためコメントアウト

    # 状態のロード
    state = load_state()
    story_id = state["story_id"]
    notion_page_id = state["notion_page_id"]
    part_number = state["part_number"]

    try:
        # 初回実行時または状態がクリアされた場合
        if story_id is None or notion_page_id is None:
            story_id = f"story_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            initial_title = f"連続ストーリー_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            notion_page_id = notion_service.create_page(title=initial_title, content="## ストーリー開始\n")
            part_number = 0 # 最初のパートなので0にリセット
            logger.info(f"新しいストーリーを開始: Story ID: {story_id}, Notion Page ID: {notion_page_id}")
            save_state({"story_id": story_id, "notion_page_id": notion_page_id, "part_number": part_number})

        logger.info(f"1. ストーリーの次のエピソードを生成中 (現在のパート: {part_number})...")
        new_episode, story_explanation = story_generator.generate_story()
        part_number += 1
        logger.info(f"第{part_number}話生成完了: {new_episode[:50]}...")
        save_state({"story_id": story_id, "notion_page_id": notion_page_id, "part_number": part_number})

        logger.info(f"2. 第{part_number}話のイラスト用プロンプトを生成中...")
        prompt, prompt_explanation = story_splitter.convert_to_illustration_prompt(new_episode)
        logger.info(f"イラスト用プロンプト: {prompt[:50]}...")

        logger.info(f"3. 第{part_number}話のイラストを生成中...")
        # ImageGeneratorのgenerate_illustrationはダミーなので、引数は適当
        image_path = image_generator.generate_illustration(
            prompt,
            # num_inference_steps=20,
            # guidance_scale=7.5,
            # image_size=(512, 512),
            # negative_prompt="blurry, low quality, deformed"
        )
        
        # ダミー画像生成なので、ファイル名を具体的に指定
        output_image_filename = f"illustration_part_{part_number}.png"
        final_image_path = os.path.join(image_generator.image_output_dir, output_image_filename)
        # ダミー画像を保存する（ここでは空のファイルを作成するだけ）
        with open(final_image_path, "w") as f:
            f.write("dummy image content")

        logger.info(f"第{part_number}話のイラスト生成完了: {final_image_path}")

        # logger.info(f"4. 第{part_number}話の画像分析とプロンプト改善を開始中...")
        # improved_prompt, analysis = manga_improver.analyze_and_improve(final_image_path, prompt)
        # logger.info(f"第{part_number}話の画像分析とプロンプト改善完了")

        story_content_to_add = f"""
## 第{part_number}話
{new_episode}

"""
        logger.info(f"5. 第{part_number}話のストーリーとイラストをNotionに保存中...")
        notion_service.append_content_to_page(
            page_id=notion_page_id,
            content=story_content_to_add,
            image_path=final_image_path
        )
        logger.info(f"既存のNotionページに第{part_number}話を追加完了: {notion_page_id}")

        # 分析レポートもDaily Reportテーブルに保存
        daily_report = f"""
## 第{part_number}話 生成レポート

### ストーリー生成プロセス
{story_explanation}

### イラスト生成プロセス
{prompt_explanation}
"""
        logger.info("6. 生成レポートをDaily Reportテーブルに保存中...")
        report_page_id = notion_service.create_page(
            title=f"Daily Report - {story_id} - Part {part_number}",
            content=daily_report
        )
        logger.info(f"分析レポートの保存完了: {report_page_id}")

        logger.info("プロセスが正常に完了しました！")

    except Exception as e:
        logger.error(f"プロセス中にエラーが発生しました: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    main() 