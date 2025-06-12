import os
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

class StorySplitter:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        # プロンプトテンプレートのパス
        prompt_file = Path(__file__).parent.parent / "prompts" / "illustration_prompt.txt"
        with open(prompt_file, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()

    def convert_to_illustration_prompt(self, story):
        """
        ストーリーを一枚のイラスト用の英語プロンプトに変換する
        Args:
            story (str): 生成されたストーリー（日本語または英語）
        Returns:
            str: イラスト用の英語プロンプト
        """
        user_prompt = f"Story:\n{story}"
        response = self.client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=200
        )
        prompt = response.choices[0].message.content.strip()
        return prompt 