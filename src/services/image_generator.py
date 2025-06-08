# -*- coding: utf-8 -*-

import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class ImageGenerator:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.api_url = "https://api.openai.com/v1/images/generations"
        self.upload_dir = "uploads"
        
        # uploadsディレクトリが存在しない場合は作成
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)
        
    def generate_image(self, prompt, size="256x256", n=1):
        """
        ChatGPTの画像生成APIを使用して画像を生成します
        
        Args:
            prompt (str): 画像生成のためのプロンプト
            size (str): 生成する画像のサイズ（"256x256", "512x512", "1024x1024"）
            n (int): 生成する画像の数（1-10）
            
        Returns:
            list: 生成された画像のURLのリスト
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "prompt": prompt,
            "n": n,
            "size": size
        }
        
        # デバッグ用にリクエスト内容を表示
        print("=== APIリクエスト内容 ===")
        print("headers:", headers)
        print("data:", data)
        print("======================")
        
        try:
            response = requests.post(self.api_url, headers=headers, json=data)
            response.raise_for_status()
            return [image["url"] for image in response.json()["data"]]
        except requests.exceptions.RequestException as e:
            print(f"エラーが発生しました: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print("レスポンス内容:", e.response.text)
            return None

    def download_image(self, url, filename=None):
        """
        生成された画像をダウンロードして保存します
        
        Args:
            url (str): 画像のURL
            filename (str, optional): 保存するファイル名。指定がない場合は自動生成
            
        Returns:
            str: 保存された画像のパス
        """
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            if filename is None:
                # タイムスタンプを含むファイル名を生成
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"generated_image_{timestamp}.png"
            
            save_path = os.path.join(self.upload_dir, filename)
            
            with open(save_path, 'wb') as f:
                f.write(response.content)
            print(f"画像を保存しました: {save_path}")
            return save_path
            
        except requests.exceptions.RequestException as e:
            print(f"ダウンロード中にエラーが発生しました: {e}")
            return None

    def generate_and_save_image(self, prompt, size="256x256", filename=None):
        """
        画像を生成して保存する一連の処理を行います
        
        Args:
            prompt (str): 画像生成のためのプロンプト
            size (str): 生成する画像のサイズ
            filename (str, optional): 保存するファイル名
            
        Returns:
            str: 保存された画像のパス
        """
        image_urls = self.generate_image(prompt, size=size, n=1)
        if image_urls and len(image_urls) > 0:
            return self.download_image(image_urls[0], filename)
        return None

# メインの実行部分
if __name__ == "__main__":
    generator = ImageGenerator()
    
    # テスト用の短いプロンプト
    test_prompt = "simple red circle on white background"
    
    print("画像を生成中...")
    saved_path = generator.generate_and_save_image(test_prompt)
    
    if saved_path:
        print(f"画像が正常に生成され、保存されました: {saved_path}")
    else:
        print("画像の生成に失敗しました") 