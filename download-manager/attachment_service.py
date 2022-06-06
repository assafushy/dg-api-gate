import datetime
from minio import Minio
import sys
import os
import requests
import base64
from datetime import datetime
from PIL import Image


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
        self.image_extensions = [".jpg", ".jpeg", ".png", ".ico", ".im", ".pcx", ".tga", ".tiff"]

    async def process_attachment(self):
        try:
            file_name = self.url.split("/")[-1] + self.ext
            time_now = datetime.now().strftime("%Y-%m-%d")
            file_bucket_path = f"{self.project_name}/{time_now}/{file_name}"
            value = {}
            azure_response = requests.get(self.url+"?download=true", headers=self.headers)
            open(file_name, 'wb').write(azure_response.content)
            if os.stat(file_name).st_size == 0:
                os.remove(file_name)
                full_download_path = f"http://{self.minio_end_point}/attachments/bad-attachment.png"
                file_name = "bad-attachment.png"
                value = {
                    "attachmentPath": full_download_path,
                    "fileName": file_name
                    }
            else:
                client = Minio(
                    self.minio_end_point,
                    access_key=self.minio_access_key,
                    secret_key=self.minio_secret_key,
                    secure=False,
                )
                full_download_path = f"http://{self.minio_end_point}/{self.bucket_name}/{file_bucket_path}"
                client.fput_object(
                    self.bucket_name, file_bucket_path, file_name,
                )
                if self.ext.lower() in self.image_extensions:
                    image = Image.open(file_name)
                    thumbnail_name = self.url.split("/")[-1] + "-thumbnail" + self.ext
                    thumbnail_file_path = f"{self.project_name}/{time_now}/{thumbnail_name}"
                    thumbnail_image = image.resize((256, 256))
                    thumbnail_image.save(thumbnail_name)
                    client.fput_object(
                        self.bucket_name, thumbnail_file_path, thumbnail_name,
                    )
                    thumbnail_path = f"http://{self.minio_end_point}/{self.bucket_name}/{thumbnail_file_path}"
                    os.remove(thumbnail_name)
                    value = {
                        "attachmentPath": full_download_path,
                        "fileName": file_name,
                        "thumbnailPath": thumbnail_path,
                        "thumbnailName": thumbnail_name
                        }
                else:
                    value = {
                        "attachmentPath": full_download_path,
                        "fileName": file_name
                        }
                os.remove(file_name)
        except:
            full_download_path = f"http://{self.minio_end_point}/attachments/assets/bad-attachment.png"
            file_name = "bad-attachment.png"
            value = {
                "attachmentPath": full_download_path,
                "fileName": file_name
            }
        print(value)
        sys.stdout.flush()
        return value

