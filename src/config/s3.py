import os
import boto3
from botocore.config import Config

# S3クライアントの設定
s3_config = Config(
    region_name='ap-northeast-1',
    signature_version='s3v4',
    retries={
        'max_attempts': 3,
        'mode': 'standard'
    }
)

# S3クライアントの初期化
s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    config=s3_config
)

# バケット名
BUCKET_NAME = os.getenv('AWS_S3_BUCKET_NAME', 'seekin-demo-images')

# 画像の有効期限（秒）
IMAGE_EXPIRATION = 3600  # 1時間 