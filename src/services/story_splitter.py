import os
from openai import OpenAI
from dotenv import load_dotenv

class StorySplitter:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def convert_to_illustration_prompt(self, story):
        """
        ストーリーを一枚のイラスト用の英語プロンプトに変換する
        Args:
            story (str): 生成されたストーリー（日本語または英語）
        Returns:
            str: イラスト用の英語プロンプト
        """
        system_prompt = (
            "You are a professional illustrator and prompt engineer. "
            "Given the following story, create a single, vivid English prompt suitable for Stable Diffusion image generation. "
            "The prompt should be structured in groups separated by BREAK, with each group focusing on different aspects: "
            "1. Main subject and characters (weight: 1.2) "
            "2. Scene and background (weight: 1.0) "
            "3. Style and atmosphere (weight: 0.8) "
            "4. Technical details (weight: 0.6) "
            "Each group should be concise and focused. "
            "Use BREAK to separate groups. "
            "Format: (subject:1.2), (background:1.0), (style:0.8), (technical:0.6)"
        )
        user_prompt = f"Story:\n{story}"
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=200
        )
        prompt = response.choices[0].message.content.strip()
        return prompt 