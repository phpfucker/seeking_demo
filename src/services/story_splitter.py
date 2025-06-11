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
            "You are a professional illustrator and prompt engineer for Stable Diffusion. "
            "Given the following story, create a single, vivid English prompt suitable for Stable Diffusion image generation. "
            "Follow these rules strictly:\n"
            "1. The illustration must depict only ONE main character. Do NOT include multiple people, animals, or creatures.\n"
            "2. Start with the main subject and character, using descriptive adjectives\n"
            "3. Add the scene and background details, but keep the composition simple\n"
            "4. Specify the art style and atmosphere\n"
            "5. Add quality modifiers\n\n"
            "Important guidelines:\n"
            "- Do NOT include multiple characters, crowds, or complex scenes.\n"
            "- Use commas to separate different elements\n"
            "- Include specific details about lighting, colors, and mood\n"
            "- Add quality boosters like 'highly detailed', 'masterpiece', 'best quality'\n"
            "- Keep the total length under 100 words\n"
            "- Avoid complex or abstract descriptions\n"
            "- Example negative prompt: 'EasyNegativeV2, (worst quality:2), (low quality), bad anatomy, bad face, (moles:2), out of focus, blurry, nsfw, nipples, extra limbs, multiple people, crowd, deformed, more than one character, group, background people, animal, creature, sexy'\n\n"
            "Example format:\n"
            "'masterpiece, best quality, highly detailed, beautiful, realistic, (furry:1.2), cat girl, cat ears, cat tail, fluffy, looking at viewer, soft warm lighting, school uniform, outdoor, at night, anime style, detailed facial expression, upper body, standing'"
        )
        user_prompt = f"Story:\n{story}"
        response = self.client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=200
        )
        prompt = response.choices[0].message.content.strip()
        return prompt 