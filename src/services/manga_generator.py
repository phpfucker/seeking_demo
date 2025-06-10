import torch
from diffusers import StableDiffusionPipeline
from PIL import Image
import os
from .manga_improver import MangaImprover

class MangaGenerator:
    def __init__(self, model_path="runwayml/stable-diffusion-v1-5", device="cuda" if torch.cuda.is_available() else "cpu"):
        self.device = device
        self.pipe = StableDiffusionPipeline.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            safety_checker=None  # NSFWフィルタを無効化
        )
        self.pipe = self.pipe.to(device)
        self.pipe.safety_checker = None  # 念のため明示的に無効化
        self.manga_improver = MangaImprover()
        
        # プロンプトファイルのパスを保存
        self.prompt_file = os.path.join(os.path.dirname(__file__), "..", "prompts", "manga_prompt.txt")
        
        # プロンプトの読み込み
        self._load_prompts()

    def _load_prompts(self):
        """プロンプトテンプレートを外部ファイルから読み込む"""
        with open(self.prompt_file, "r", encoding="utf-8") as f:
            content = f.read()
            
        # プロンプトの抽出
        for line in content.split("\n"):
            if line.startswith("MAIN_PROMPT_TEMPLATE = "):
                self.main_prompt_template = line.split("=", 1)[1].strip().strip('"')
            elif line.startswith("NEGATIVE_PROMPT = "):
                self.negative_prompt = line.split("=", 1)[1].strip().strip('"')

    def generate_illustration(self, prompt, negative_prompt=None, num_inference_steps=30, guidance_scale=7.5, image_size=(256, 192)):
        """
        一枚のイラストを生成する
        Args:
            prompt (str): イラスト生成用のプロンプト（英語）
            negative_prompt (str): ネガティブプロンプト（Noneの場合はデフォルト値を使用）
            num_inference_steps (int): 推論ステップ数
            guidance_scale (float): ガイダンススケール
            image_size (tuple): 生成する画像のサイズ
        Returns:
            PIL.Image: 生成された画像
        """
        # デフォルトのネガティブプロンプトを使用
        if negative_prompt is None:
            negative_prompt = self.negative_prompt

        # 画像生成
        result = self.pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            width=image_size[0],
            height=image_size[1]
        ).images[0]

        return result

    def save_image(self, image, output_path):
        """
        画像を保存する
        
        Args:
            image (PIL.Image): 保存する画像
            output_path (str): 保存先のパス
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        image.save(output_path)

# 使用例
if __name__ == "__main__":
    generator = MangaGenerator()
    test_prompt = "anime style, colorful, friendly animals, beautiful forest, unity, warmth, expressive faces, soft lighting, safe content, high quality"
    image = generator.generate_illustration(test_prompt)
    generator.save_image(image, "output/test_illustration.png") 