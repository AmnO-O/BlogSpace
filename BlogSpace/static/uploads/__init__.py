from flask import Blueprint, request, current_app
from werkzeug.utils import secure_filename
import os
import uuid

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_image(file, user_id: int) -> str | None:
    if not file or file.filename == "":
        return None

    if not allowed_file(file.filename):
        return None  

    ext = file.filename.rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"

    user_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], f"user_{user_id}")
    os.makedirs(user_folder, exist_ok=True)

    path = os.path.join(user_folder, unique_name)
    file.save(path)
    
    return f"uploads/user_{user_id}/{unique_name}"
