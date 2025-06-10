import cv2
import numpy as np
from PIL import Image
import pytesseract
import re
from transformers import pipeline
import torch

class ImageAnalyzer:
    def __init__(self):
        # 感情分析用のパイプライン
        self.sentiment_analyzer = pipeline("sentiment-analysis")
        # 画像分類用のパイプライン
        self.image_classifier = pipeline("image-classification")
        
    def analyze_image(self, image_path):
        """
        画像を分析し、改善点を特定します
        
        Args:
            image_path (str): 分析する画像のパス
            
        Returns:
            dict: 分析結果と改善提案
        """
        # 画像を読み込み
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("画像を読み込めませんでした")
            
        # 分析結果を格納する辞書
        analysis = {
            "issues": [],
            "suggestions": []
        }
        
        # 1. セリフの分析
        self._analyze_speech_bubbles(image, analysis)
        
        # 2. 背景の分析
        self._analyze_background(image, analysis)
        
        # 3. キャラクターの分析
        self._analyze_characters(image, analysis)
        
        # 4. 全体的な構成の分析
        self._analyze_composition(image, analysis)
        
        return analysis
    
    def _analyze_speech_bubbles(self, image, analysis):
        """セリフの分析"""
        # グレースケール変換
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # セリフの検出（白い領域の検出）
        _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if w > 50 and h > 20:  # セリフらしいサイズの領域
                # セリフ部分を切り出し
                speech_area = image[y:y+h, x:x+w]
                
                # OCRでテキスト認識
                text = pytesseract.image_to_string(speech_area, lang='eng')
                
                # 英語として正しいかチェック
                if not self._is_valid_english(text):
                    analysis["issues"].append("セリフの英語が不自然です")
                    analysis["suggestions"].append("より自然な英語のセリフを使用してください")
                
                # テキストの可読性チェック
                if not self._is_readable(text):
                    analysis["issues"].append("セリフが読みにくいです")
                    analysis["suggestions"].append("セリフのフォントサイズを大きくし、コントラストを改善してください")
    
    def _analyze_background(self, image, analysis):
        """背景の分析"""
        # 背景の有無をチェック
        if self._is_empty_background(image):
            analysis["issues"].append("背景が描かれていません")
            analysis["suggestions"].append("ストーリーに合った背景を追加してください")
        
        # 背景の適切性をチェック
        if not self._is_background_appropriate(image):
            analysis["issues"].append("背景がストーリーに合っていません")
            analysis["suggestions"].append("ストーリーの設定に合わせた背景を描いてください")
    
    def _analyze_characters(self, image, analysis):
        """キャラクターの分析"""
        # キャラクターの一貫性チェック
        if not self._are_characters_consistent(image):
            analysis["issues"].append("キャラクターの見た目が一貫していません")
            analysis["suggestions"].append("キャラクターデザインを統一してください")
        
        # キャラクターの現代性チェック
        if not self._are_characters_modern(image):
            analysis["issues"].append("キャラクターの見た目が現代的ではありません")
            analysis["suggestions"].append("より現代的なキャラクターデザインにしてください")
    
    def _analyze_composition(self, image, analysis):
        """全体的な構成の分析"""
        # 画像サイズのチェック
        if self._is_image_cropped(image):
            analysis["issues"].append("画像が途中で切れています")
            analysis["suggestions"].append("適切な画像サイズを設定してください")
        
        # カラー/モノクロのチェック
        if self._is_color_image(image):
            analysis["issues"].append("画像がカラーです")
            analysis["suggestions"].append("モノクロの漫画スタイルにしてください")
    
    def _is_valid_english(self, text):
        """英語として正しいかチェック"""
        # 基本的な英語のパターンにマッチするか
        english_pattern = re.compile(r'^[A-Za-z\s\.,!?]+$')
        return bool(english_pattern.match(text.strip()))
    
    def _is_readable(self, text):
        """テキストの可読性チェック"""
        return len(text.strip()) > 0
    
    def _is_empty_background(self, image):
        """背景が空かどうかチェック"""
        # 背景の複雑さを計算
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        return np.mean(edges) < 10
    
    def _is_background_appropriate(self, image):
        """背景が適切かどうかチェック"""
        # 背景の分類
        result = self.image_classifier(image)
        # 適切な背景かどうかの判定ロジック
        return True  # 実装が必要
    
    def _are_characters_consistent(self, image):
        """キャラクターの一貫性チェック"""
        # キャラクターの特徴抽出と比較
        return True  # 実装が必要
    
    def _are_characters_modern(self, image):
        """キャラクターの現代性チェック"""
        # キャラクターのスタイル分析
        return True  # 実装が必要
    
    def _is_image_cropped(self, image):
        """画像が切れているかチェック"""
        # エッジ検出で画像の端をチェック
        edges = cv2.Canny(image, 100, 200)
        return np.mean(edges[0:10, :]) > 50 or np.mean(edges[-10:, :]) > 50
    
    def _is_color_image(self, image):
        """カラー画像かどうかチェック"""
        # カラーの分散を計算
        color_std = np.std(image, axis=(0, 1))
        return np.mean(color_std) > 30 