import os
import openai
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class StoryGenerator:
    def __init__(self):
        # OpenAI APIキーの設定
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        # プロンプトファイルの読み込み
        prompt_file = Path(__file__).parent.parent / "prompts" / "story_prompt.txt"
        with open(prompt_file, "r", encoding="utf-8") as f:
            self.prompt_template = f.read()

    def generate_story(self):
        """ChatGPTを使ってストーリーを生成する"""
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "あなたは物語を書くプロフェッショナルです。必ず以下の形式で出力してください：\n\nSTORY:\n[ストーリー本文]\n\nGENERATION_PROCESS:\n[生成プロセスの説明]"},
                    {"role": "user", "content": self.prompt_template + "\n\n生成したストーリーについて、以下の点を必ず説明してください：\n1. このストーリーを生成する際の意図\n2. ストーリー展開の工夫\n3. キャラクター描写の工夫\n4. 感情表現の工夫\n5. メッセージ性の工夫\n\n必ず「STORY:」と「GENERATION_PROCESS:」で区切って出力してください。"}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            # 応答をストーリーと説明に分割
            content = response.choices[0].message.content.strip()
            if "STORY:" in content and "GENERATION_PROCESS:" in content:
                story_part = content.split("STORY:")[1].split("GENERATION_PROCESS:")[0].strip()
                process_part = content.split("GENERATION_PROCESS:")[1].strip()
                return story_part, process_part
            else:
                # フォーマットが正しくない場合は、従来の方法で分割を試みる
                if "\n\n説明：" in content:
                    story, explanation = content.split("\n\n説明：", 1)
                elif "説明：" in content:
                    story, explanation = content.split("説明：", 1)
                else:
                    story = content
                    explanation = "生成プロセスの詳細は利用できません。"
                return story.strip(), explanation.strip()
        except Exception as e:
            logger.error(f"ストーリー生成中にエラーが発生: {str(e)}")
            raise 