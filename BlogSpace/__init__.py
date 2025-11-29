from flask import Flask, render_template, request
from .auth import auth_bp
from .user import user_bp
from .database import init_database
from .static.uploads import upload_bp
from .main import main_bp
from datetime import timedelta
from werkzeug.utils import secure_filename
import os


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "hahadungroiday726"
    app.permanent_session_lifetime = timedelta(days=7)

    basedir = os.path.abspath(os.path.dirname(__file__))
    upload_path = os.path.join(basedir, 'static', 'uploads')
    app.config['UPLOAD_FOLDER'] = upload_path
    os.makedirs(upload_path, exist_ok=True)
    
    # Register
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(upload_bp)

    # cấu hình database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    init_database(app)
    
    return app; 
