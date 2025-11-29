from .. import db
from ..models.user_model import User

class UserRepository:
    @staticmethod
    def get_all_users():
        """Lấy tất cả người dùng."""
        return User.query.all()

    @staticmethod
    def get_user_by_id(user_id):
        """Lấy người dùng theo ID."""
        return User.query.get(user_id)

    @staticmethod
    def get_user_by_username(username):
        """Lấy người dùng theo tên đăng nhập."""
        return User.query.filter_by(username=username).first()
    
    @staticmethod
    def get_user_by_email(email):
        """Lấy người dùng theo email."""
        return User.query.filter_by(email=email).first()
    
    @staticmethod
    def add_user(username, email, password_hash):
        """Thêm người dùng mới."""
        new_user = User(username=username, email=email, password_hash=password_hash)
        db.session.add(new_user)
        return new_user

    @staticmethod
    def update_user(user_id, **kwargs):
        """Cập nhật thông tin người dùng."""
        user = UserRepository.get_user_by_id(user_id)
        if user:
            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            return user
        return None

    @staticmethod
    def delete_user(user_id):
        """Xóa người dùng."""
        user = UserRepository.get_user_by_id(user_id)
        if user:
            db.session.delete(user)
            return True
        return False
    
    @staticmethod
    def verify_password(user, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(user.password_hash, password)
    

class UserService:
    def __init__(self, repository = UserRepository): 
        self.repo = repository

    def register_user(self, username, email, password):        
        if self.repo.get_user_by_email(email):
            return False, "Email đã tồn tại!"
        
        if self.repo.get_user_by_username(username):
            return False, "Tên đăng nhập đã tồn tại!"
        
        from werkzeug.security import generate_password_hash
        hashed_password = generate_password_hash(password)
        
        new_user = self.repo.add_user(
            username=username,
            email=email,
            password_hash=hashed_password
        )
        
        try:
            db.session.commit()
            return True, new_user 
        except Exception as e:
            db.session.rollback() 
            return False, f"Đã xảy ra lỗi: {e}"
        

    def authenticate_user(self, email, password):
        user = self.repo.get_user_by_email(email)
        if not user:
            return None

        if not self.repo.verify_password(user, password):
            return None

        return user