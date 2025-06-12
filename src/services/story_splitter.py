import os
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
import re

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
            tuple: (イラスト用の英語プロンプト, 説明テキストは空文字)
        """
        # ChatGPT には「プロンプトのみを一行で返せ」と指示
        user_prompt = (
            "Story:\n" + story +
            "\n\nGenerate ONE Stable Diffusion prompt following the system rules. "
            "Output ONLY the prompt line with comma-separated tags. Do NOT output any explanation or extra text."
        )
        response = self.client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=150
        )
        content = response.choices[0].message.content.strip()
        # 念のため最初の行だけを採用
        prompt_line = content.split("\n", 1)[0].strip()

        # manga_prompt.txt を更新
        self._update_manga_prompt(prompt_line)

        return prompt_line, ""  # 説明なし

    def _update_manga_prompt(self, prompt):
        """
        生成されたプロンプトで manga_prompt.txt を更新する
        Args:
            prompt (str): Stable Diffusion 用プロンプト
        """
        try:
            prompt_only = prompt.replace('"', '\\"')
            prompt_file_path = Path(__file__).parent.parent / "prompts" / "manga_prompt.txt"
            with open(prompt_file_path, "w", encoding="utf-8") as f:
                f.write('# メインプロンプトテンプレート\n')
                f.write(f'MAIN_PROMPT_TEMPLATE = "{prompt_only}"\n\n')
                f.write('NEGATIVE_PROMPT = "EasyNegativeV2, (worst quality:2), (low quality), bad anatomy, bad face, (moles:2), out of focus, blurry, nsfw, nipples, extra limbs, multiple people, crowd, deformed, more than one character, group, background people, animal, creature, sexy"')
        except Exception as e:
            print(f"プロンプトテンプレートの更新中にエラーが発生しました: {str(e)}") 