from minio import Minio
import sys
import os
import requests
import base64


class AttachmentService:
    def __init__(self, bucket_name, minio_end_point, minio_access_key, minio_secret_key, url, ext, project_name,token):
        self.bucket_name = bucket_name
        self.minio_end_point = minio_end_point
        self.minio_access_key = minio_access_key
        self.minio_secret_key = minio_secret_key
        self.url = url
        self.ext = ext
        self.project_name = project_name
        self.token = token
        self.authorization = str(base64.b64encode(bytes(':' + self.token, 'ascii')), 'ascii')
        self.headers = {
          'Authorization': 'Basic '+self.authorization
        }

    async def process_attachment(self):
        file_name = self.url.split("/")[-1] + self.ext
        file_bucket_path = f"{self.project_name}/{file_name}"
        azure_response = requests.get(url=self.url, headers=self.headers)
        open(file_name, 'wb').write(azure_response.content)
        full_download_path = f"http://{self.minio_end_point}/{self.bucket_name}/{file_bucket_path}"
        client = Minio(
            self.minio_end_point,
            access_key=self.minio_access_key,
            secret_key=self.minio_secret_key,
            secure=False,
        )
        client.fput_object(
            self.bucket_name, file_bucket_path, file_name,
        )
        os.remove(file_name)
        value = {
            "attachmentPath": full_download_path,
            "fileName": file_name
        }
        print(value)
        sys.stdout.flush()
        return value

