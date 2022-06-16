import flask
from minio.error import S3Error
from flask import request, jsonify
from attachment_service import AttachmentService
from asgiref.wsgi import WsgiToAsgi


app = flask.Flask(__name__)


try:
    @app.route('/uploadAttachment', methods=['POST'])
    async def home():
        json = request.get_json()
        try:
            attachment_service = AttachmentService(
                json['bucketName'],
                json['minioEndPoint'],
                json['minioAccessKey'],
                json['minioSecretKey'],
                json['downloadUrl'],
                json['fileExtension'],
                json['projectName'],
                json['token']
            )
            res = await attachment_service.process_attachment()
        except S3Error as exc:
            print("error occurred.", exc)
        except:
            full_download_path = f"http://{json['minioEndPoint']}/attachments/bad-attachment.png"
            file_name = "bad-attachment.png"
            value = {
                "attachmentPath": full_download_path,
                "fileName": file_name
                }
            return jsonify(value)
        return jsonify(res)
except request.exceptions.RequestException as e:
    pass


download_manager_app = WsgiToAsgi(app)
