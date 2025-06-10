from openai import OpenAI
import os

class PromptImprover:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    def improve_prompt(self, original_prompt, analysis):
        """
        分析結果に基づいてイラスト用プロンプトを改善します
        Args:
            original_prompt (str): 元のプロンプト
            analysis (dict): 画像分析の結果
        Returns:
            str: 改善されたプロンプト
        """
        issues = "\n".join([f"- {issue}" for issue in analysis["issues"]])
        suggestions = "\n".join([f"- {suggestion}" for suggestion in analysis["suggestions"]])
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "あなたはイラストのプロンプトエンジニアです。与えられた分析結果に基づいて、Stable Diffusionのイラスト用プロンプトを改善してください。以下の点に注意してください：\n1. キャラクターや雰囲気が明確で安全であること\n2. 背景や色彩がストーリーに合っていること\n3. 一貫性のあるスタイル\n4. 不適切な表現や危険ワードを含まないこと"
                },
                {
                    "role": "user",
                    "content": f"元のプロンプト：\n{original_prompt}\n\n分析で見つかった問題点：\n{issues}\n\n改善提案：\n{suggestions}\n\nこれらの問題点を解決するように、イラスト用プロンプトを改善してください。"
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        return response.choices[0].message.content 