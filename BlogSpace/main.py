from flask import Blueprint, render_template, jsonify, abort, session, request
from .database.repository.blog_repo import BlogService


blog_service = BlogService()

main_bp = Blueprint('views', __name__)

@main_bp.route("/")
def homepage():
    return render_template('index.html')

@main_bp.route("/database/get_all_blogs", methods = ["GET"])
def get_all_blogs():
    list_all_from_db = blog_service.list_all()
    output = []

    # print(len(list_all_from_db))

    for blog in list_all_from_db:
        views = blog.stats.total_views if blog.stats else 0
        likes = blog.stats.total_likes if blog.stats else 0
        comments = blog.stats.total_comments if blog.stats else 0
        tags_list = blog.tags.split(',') if blog.tags else []
        excerpt_text = blog.content[:150] + "..." if len(blog.content) > 150 else blog.content
        image_path = blog.featured_image_path

        if not image_path:
            image_path = 'uploads/avata.jpg'
        # print(image_path)

        blog_data = {
            'id': blog.id,
            'title': blog.title,
            'excerpt': blog.seo_description,
            'content': blog.content,
            'author': blog.author.username if blog.author else "Unknown", 
            
            'category': blog.category,
            'date': blog.created_at.strftime('%d %b %Y'), 
            'dateISO': blog.created_at.isoformat(),     

            'views': views,
            'likes': likes,
            'comments': comments, 
            'tags': tags_list,  
            'featured_image': image_path
        }
        output.append(blog_data)


    return jsonify(output); 

# GET (Lấy dữ liệu)	POST (Gửi dữ liệu)
## GET Lấy (đọc) dữ liệu từ server.	
## POST Gửi (tạo mới) dữ liệu lên server.
