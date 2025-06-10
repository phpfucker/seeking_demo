# -*- coding: utf-8 -*-

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import base64
from openai import OpenAI
from src.services.s3_service import S3Service

class MangaImprover:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.s3_service = S3Service()
        
        # 効果的なプロンプトパターン
        self.effective_prompt_patterns = {
            "manga_style": [
                "masterpiece, best quality, ultra-detailed, high resolution",
                "manga style, professional manga art, clean line art",
                "detailed background, atmospheric perspective",
                "dynamic composition, professional illustration"
            ],
            "character_expression": [
                "expressive eyes, detailed facial features",
                "emotional expression, subtle emotions",
                "character design, unique style"
            ],
            "technical_quality": [
                "sharp focus, high contrast",
                "professional lighting, dramatic shadows",
                "texture details, fine details"
            ],
            "negative_prompt": [
                "blurry, low quality, low resolution",
                "deformed, disfigured, bad anatomy",
                "ugly, bad proportions, extra limbs"
            ]
        }
        
        # プロンプト改善のためのテンプレート
        self.prompt_improvement_template = """
以下の画像分析結果と元のプロンプトを基に、より効果的なStable Diffusionのイラスト用プロンプトを生成してください。

【画像分析結果】
{analysis}

【元のプロンプト】
{original_prompt}

以下の要素を考慮して、改善されたプロンプトを生成してください。
各要素はBREAKで区切り、重み付けを指定してください：

1. メインサブジェクトとキャラクター (weight: 1.2)
2. シーンと背景 (weight: 1.0)
3. スタイルと雰囲気 (weight: 0.8)
4. 技術的な詳細 (weight: 0.6)

出力形式：
(subject:1.2) ... BREAK
(background:1.0) ... BREAK
(style:0.8) ... BREAK
(technical:0.6) ...

注意事項：
- 各セクションは75トークン以内に収めてください
- 重要な要素には重み付けを調整してください
- 出力は英語で、簡潔に記述してください
"""
    
    def analyze_and_improve(self, image_path, original_prompt):
        """画像を分析し、プロンプトを改善する（イラスト専用）"""
        try:
            # 画像をbase64エンコード
            with open(image_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')

            # 画像分析
            analysis_response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "このイラスト画像を分析し、以下の点について詳細に説明してください：\n1. メインサブジェクトとキャラクターの表現\n2. 森の背景や雰囲気\n3. 色彩やスタイル\n4. 技術的な品質\n5. 改善点"},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}}
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            analysis = analysis_response.choices[0].message.content
            
            # 分析結果から問題点と改善提案を抽出
            issues_response = self.client.chat.completions.create(
                model="gpt-3.5-turbo-1106",
                messages=[
                    {"role": "system", "content": "画像分析結果から問題点と改善提案を抽出してください。"},
                    {"role": "user", "content": f"分析結果：\n{analysis}\n\n上記の分析結果から、以下の形式で問題点と改善提案を抽出してください：\n\n問題点：\n- 問題1\n- 問題2\n\n改善提案：\n- 提案1\n- 提案2"}
                ],
                temperature=0.7,
                max_tokens=200
            )
            
            issues_suggestions = issues_response.choices[0].message.content
            issues = "\n".join([line for line in issues_suggestions.split("\n") if line.startswith("-") and "問題点：" in issues_suggestions[:issues_suggestions.find(line)]])
            suggestions = "\n".join([line for line in issues_suggestions.split("\n") if line.startswith("-") and "改善提案：" in issues_suggestions[:issues_suggestions.find(line)]])
            
            # プロンプト改善
            improved_prompt = self._extract_improved_prompt(analysis, original_prompt, issues, suggestions)
            self._update_prompt_template(improved_prompt)
            return improved_prompt, analysis
            
        except Exception as e:
            print(f"画像分析中にエラーが発生しました: {str(e)}")
            return original_prompt, str(e)
    
    def _extract_improved_prompt(self, analysis: str, original_prompt: str, issues: str = "", suggestions: str = "") -> str:
        """画像分析結果と元のプロンプトから改善されたプロンプトを生成"""
        try:
            # プロンプトの生成
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo-1106",
                messages=[
                    {"role": "system", "content": "あなたはイラストのプロンプトエンジニアです。与えられた分析結果に基づいて、Stable Diffusionのイラスト用プロンプトを改善してください。以下の点に特に注意してください：\n1. 主題・キャラクター・状況をシンプルかつ具体的に記述すること（例：A gorilla beastman with a confident smile and a gemstone girl with a gentle expression are sitting close together in a cozy room, having a friendly conversation.）\n2. 比喩や抽象的・複雑な表現は避けること\n3. キャラクター数は2体程度に絞ること（まずはゴリラ獣人と宝石少女）\n4. 背景や雰囲気も明確に指定すること\n5. 一貫性のあるスタイル、危険ワードを含まないこと"},
                    {"role": "user", "content": f"元のプロンプト：\n{original_prompt}\n\n分析で見つかった問題点：\n{issues}\n\n改善提案：\n{suggestions}\n\nこれらの問題点を解決するように、イラスト用プロンプトを改善してください。"}
                ],
                temperature=0.7,
                max_tokens=100
            )
            improved_prompt = response.choices[0].message.content.strip()
            improved_prompt = self._optimize_prompt(improved_prompt)
            return improved_prompt
        except Exception as e:
            print(f"プロンプト改善中にエラーが発生: {str(e)}")
            return original_prompt

    def _optimize_prompt(self, prompt: str) -> str:
        """プロンプトを最適化する"""
        try:
            # プロンプトの構造化
            sections = prompt.split('\n')
            optimized_sections = []
            
            for section in sections:
                if section.strip():
                    # セクション番号とタイトルを削除
                    section = section.split(':', 1)[-1].strip()
                    
                    # 重複する要素の削除
                    words = section.split(',')
                    unique_words = []
                    for word in words:
                        word = word.strip()
                        if word and word not in unique_words:
                            unique_words.append(word)
                    
                    # セクションの最適化
                    optimized_section = ', '.join(unique_words)
                    if optimized_section:
                        optimized_sections.append(optimized_section)
            
            # 最終的なプロンプトの生成
            final_prompt = '\n'.join(optimized_sections)
            
            # プロンプトの長さを調整（必要に応じて）
            if len(final_prompt) > 1000:
                final_prompt = final_prompt[:1000]
            
            return final_prompt
            
        except Exception as e:
            print(f"プロンプト最適化中にエラーが発生: {str(e)}")
            return prompt

    def _update_prompt_template(self, improved_prompt):
        """改善されたプロンプトをmanga_prompt.txtに追記"""
        try:
            prompt_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "manga_prompt.txt")
            with open(prompt_file_path, "a", encoding="utf-8") as f:
                f.write(f'\n# Improved Prompt\nMAIN_PROMPT_TEMPLATE = "{improved_prompt}"\n')
            print(f"プロンプトテンプレートを追記しました: {prompt_file_path}")
        except Exception as e:
            print(f"プロンプトテンプレートの追記中にエラーが発生しました: {str(e)}") 