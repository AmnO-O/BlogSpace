from .. import db
from ..models.blog_model import Blog , BlogStats, BlogComment


class BlogRepository:
    @staticmethod
    def create_blog(data: dict) -> Blog:
        blog = Blog(**data)
        db.session.add(blog)
        db.session.commit()
        return blog

    @staticmethod
    def get_by_id(blog_id: int) -> Blog | None:
        return Blog.query.get(blog_id)

    @staticmethod
    def get_all():
        return Blog.query.order_by(Blog.created_at.desc()).all()

    @staticmethod
    def get_by_author(user_id: int):
        return Blog.query.filter_by(user_id=user_id).order_by(Blog.created_at.desc()).all()

    @staticmethod
    def update_blog(blog: Blog, data: dict):
        for key, value in data.items():
            setattr(blog, key, value)
        db.session.commit()
        return blog

    @staticmethod
    def delete_blog(blog: Blog):
        db.session.delete(blog)
        db.session.commit()

    @staticmethod
    def search(keyword: str):
        return Blog.query.filter(
            Blog.title.ilike(f"%{keyword}%") |
            Blog.content.ilike(f"%{keyword}%")
        ).all()

    @staticmethod
    def filter_by_category(category: str):
        return Blog.query.filter_by(category=category).all()


class BlogService:
    def __init__(self, repository=BlogRepository):
        self.repository = repository

    def create(self, data: dict):
        return self.repository.create_blog(data)

    def get(self, blog_id: int):
        return self.repository.get_by_id(blog_id)

    def list_all(self):
        return self.repository.get_all()

    def list_by_author(self, user_id: int):
        return self.repository.get_by_author(user_id)

    def update(self, blog_id: int, data: dict):
        blog = self.repository.get_by_id(blog_id)
        if not blog:
            return None
        return self.repository.update_blog(blog, data)

    def delete(self, blog_id: int):
        blog = self.repository.get_by_id(blog_id)
        if blog:
            self.repository.delete_blog(blog)
            return True
        return False

    def search(self, keyword: str):
        return self.repository.search(keyword)

    def filter_by_category(self, category: str):
        return self.repository.filter_by_category(category)


class BlogStatsRepository:
    @staticmethod
    def create(blog_id):
        stats = BlogStats(blog_id = blog_id)
        db.session.add(stats)
        db.session.commit()
        return stats
    
    @staticmethod
    def get_by_blog_id(blog_id):
        return BlogStats.query.filter_by(blog_id = blog_id).first()
    
    @staticmethod
    def save():
        db.session.commit()


class BlogCommentRepository:
    @staticmethod
    def create(data : dict) -> BlogComment:
        comment = BlogComment(**data)
        db.session.add(comment)
        db.session.commit()

        return comment
    
    @staticmethod
    def get_by_id(comment_id):
        return BlogComment.query.get(comment_id)

    @staticmethod    
    def get_root_comments_by_blog(blog_id):
        return BlogComment.query.filter_by(blog_id=blog_id, parent_id=None)\
                                .order_by(BlogComment.created_at.desc()).all()
    
    def delete(self, comment):
        db.session.delete(comment)
        db.session.commit() 


class BlogStatsService:
    def __init__(self):
        self.stats_repo = BlogStatsRepository()

    def init_stats_for_blog(self, blog_id):
        return self.stats_repo.create(blog_id)

    def increment_view(self, blog_id):
        stats = self.stats_repo.get_by_blog_id(blog_id)
        if stats:
            stats.total_views += 1
            self.stats_repo.save()
            return stats.total_views
        return 0

    def increment_like(self, blog_id):
        stats = self.stats_repo.get_by_blog_id(blog_id)
        if stats:
            stats.total_likes += 1
            self.stats_repo.save()
            return stats.total_likes

class BlogCommentService:
    def __init__(self):
        self.comment_repo = BlogCommentRepository()
        self.stats_repo = BlogStatsRepository() 

    def add_comment(self, blog_id, user_id, content, parent_id=None):
        new_comment = self.comment_repo.create({
            'blog_id': blog_id, 'user_id': user_id, 
            'content': content, 'parent_id': parent_id
        })        

        stats = self.stats_repo.get_by_blog_id(blog_id)
        if stats:
            stats.total_comments += 1
            self.stats_repo.save()
            
        return new_comment
    
    def get_comment_by_id(self, comment_id):
        return self.comment_repo.get_by_id(comment_id)

    def get_blog_comments(self, blog_id):
        return self.comment_repo.get_root_comments_by_blog(blog_id)