from .. import db
from datetime import datetime

class Blog(db.Model):
    __tablename__ = "blog"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    title = db.Column(db.String(255), nullable = False)
    content = db.Column(db.Text, nullable = False)
    category = db.Column(db.String(100), nullable=True) 
    tags = db.Column(db.String(255), nullable=True)

    featured_image_path = db.Column(db.String(255), nullable=True) 
    seo_description = db.Column(db.String(300), nullable=True)

    status = db.Column(db.String(20), default='draft', nullable=False) 
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    
    author = db.relationship("User", backref="posts", lazy=True)
    stats = db.relationship("BlogStats", backref="blog",
                            uselist=False, cascade="all, delete")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return f"Blog('{self.title}', Author ID: {self.user_id}, Status: {self.status})"
    
    def __str__(self):
        return f"Blog('{self.title}', Author ID: {self.user_id}, Status: {self.status})"   


class BlogStats(db.Model):
    __tablename__ = "blog_stats"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    blog_id = db.Column(db.Integer, db.ForeignKey('blog.id'), nullable=False, unique = True)

    total_views = db.Column(db.Integer, default = 0)
    total_likes = db.Column(db.Integer, default = 0)
    total_comments = db.Column(db.Integer, default = 0)


class BlogComment(db.Model):
    __tablename__ = "blog_comment"

    id = db.Column(db.Integer, primary_key = True)
    blog_id = db.Column(db.Integer, db.ForeignKey('blog.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("blog_comment.id"), nullable=True)

    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    total_likes = db.Column(db.Integer, nullable=False, default=0)
    user = db.relationship("User", backref="BlogComment")
    blog = db.relationship("Blog", backref="BlogComment")
    replies = db.relationship("BlogComment", backref=db.backref("parent", remote_side=[id]), lazy="dynamic")



## ForeignKey dùng tên bảng
## relationship dùng tên class

