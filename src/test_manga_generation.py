from services.manga_generator import MangaGenerator
import os

def main():
    # 出力ディレクトリの作成
    os.makedirs("output", exist_ok=True)
    
    # MangaGeneratorのインスタンス化
    generator = MangaGenerator()
    
    # テスト用のイラストプロンプト
    test_prompt = "anime style, colorful, friendly animals, beautiful forest, unity, warmth, expressive faces, soft lighting, safe content, high quality"
    
    print("画像生成を開始します...")
    
    # 画像生成
    image = generator.generate_illustration(test_prompt)
    
    # 画像保存
    output_path = "output/test_illustration.png"
    generator.save_image(image, output_path)
    
    print(f"画像を保存しました: {output_path}")

if __name__ == "__main__":
    main() 