import torch
from diffusers import StableDiffusionPipeline
from PIL import Image
import os

class MangaGenerator:
    def __init__(self, model_path="runwayml/stable-diffusion-v1-5", device="cuda" if torch.cuda.is_available() else "cpu"):
        self.device = device
        self.pipe = StableDiffusionPipeline.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        )
        self.pipe = self.pipe.to(device)

    def generate_manga_panels(self, prompts, negative_prompt="", num_inference_steps=30, guidance_scale=7.5, panel_size=(512, 512)):
        """
        複数のコマ画像を生成し、横に合成して1ページにする
        Args:
            prompts (list[str]): 各コマごとのプロンプト（英語）
            negative_prompt (str): ネガティブプロンプト
            num_inference_steps (int): 推論ステップ数
            guidance_scale (float): ガイダンススケール
            panel_size (tuple): 各コマのサイズ
        Returns:
            PIL.Image: 合成された1ページ画像
        """
        images = []
        for prompt in prompts:
            optimized_prompt = f"manga style, black and white, comic panel, with speech bubble containing simple English words, {prompt}"
            img = self.pipe(
                prompt=optimized_prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale
            ).images[0]
            img = img.resize(panel_size)
            images.append(img)
        # 横に合成
        total_width = panel_size[0] * len(images)
        result = Image.new('RGB', (total_width, panel_size[1]))
        for i, img in enumerate(images):
            result.paste(img, (i * panel_size[0], 0))
        return result

    def generate_manga_page(self, prompts, negative_prompt="", num_inference_steps=30, guidance_scale=7.5, panel_size=(512, 512)):
        """
        4コマ漫画ページを生成（ラッパー）
        Args:
            prompts (list[str]): 各コマごとのプロンプト
        Returns:
            PIL.Image: 生成された画像
        """
        return self.generate_manga_panels(prompts, negative_prompt, num_inference_steps, guidance_scale, panel_size)

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
    
    # テスト用のプロンプト
    test_prompts = ["A group of friends having a picnic in a park, manga style", "A group of friends having a picnic in a park, manga style"]
    negative_prompt = "low quality, blurry, distorted"
    
    # 画像生成
    image = generator.generate_manga_page(test_prompts, negative_prompt)
    
    # 画像保存
    generator.save_image(image, "output/test_manga.png") 