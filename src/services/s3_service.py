import os
from datetime import datetime
from src.config.s3 import s3, BUCKET_NAME, IMAGE_EXPIRATION

class S3Service:
    @staticmethod
    def upload_image(image_path, prefix='generated'):
        """
        画像をS3にアップロードし、署名付きURLを生成します
        
        Args:
            image_path (str): アップロードする画像のパス
            prefix (str): S3のキープレフィックス
            
        Returns:
            str: 署名付きURL
        """
        try:
            # ファイル名を生成
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.basename(image_path)
            s3_key = f"{prefix}/{timestamp}_{filename}"
            
            # 画像をアップロード
            with open(image_path, 'rb') as f:
                s3.upload_fileobj(f, BUCKET_NAME, s3_key)
            
            # 署名付きURLを生成
            url = s3.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': BUCKET_NAME,
                    'Key': s3_key
                },
                ExpiresIn=IMAGE_EXPIRATION
            )
            
            return url
        except Exception as e:
            print(f"S3への画像アップロードに失敗しました: {str(e)}")
            return None 