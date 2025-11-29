from .. import db

class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    #created_at = db.Column(db.DateTime, default=datetime.utcnow)
    #is_active = db.Column(db.Boolean, default=True)
    #is_verified = db.Column(db.Boolean, default=False)

    def __init__(self, username, email, password_hash):
        self.username = username
        self.email = email
        self.password_hash = password_hash

    def __str__(self):
        return f'<User {self.username}, email : {self.email}>'
    
    def __repr__(self):
        return f'<User {self.username}>'


