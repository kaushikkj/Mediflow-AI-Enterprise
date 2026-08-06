from io import BytesIO
import time
import boto3
from botocore.client import Config
from .config import settings

def client():
    return boto3.client("s3",endpoint_url=f"http://{settings.minio_endpoint}",aws_access_key_id=settings.minio_access_key,aws_secret_access_key=settings.minio_secret_key,config=Config(signature_version="s3v4"),region_name="us-east-1")
def ensure_bucket():
    last=None
    for _ in range(30):
        try:
            c=client()
            try: c.head_bucket(Bucket=settings.minio_bucket)
            except Exception: c.create_bucket(Bucket=settings.minio_bucket)
            return
        except Exception as exc:
            last=exc; time.sleep(2)
    raise RuntimeError(f"MinIO unavailable: {last}")
def upload(key:str,data:bytes,content_type:str): client().put_object(Bucket=settings.minio_bucket,Key=key,Body=BytesIO(data),ContentType=content_type)
def download(key:str): return client().get_object(Bucket=settings.minio_bucket,Key=key)["Body"].read()
