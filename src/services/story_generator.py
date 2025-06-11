import os
import openai
from pathlib import Path

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
                    {"role": "system", "content": "あなたは物語を書くプロフェッショナルです。"},
                    {"role": "user", "content": self.prompt_template}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            story = response.choices[0].message.content.strip()
            return story
            
        except Exception as e:
            print(f"ストーリー生成中にエラーが発生しました: {str(e)}")
            raise 