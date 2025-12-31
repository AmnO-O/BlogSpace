from flask import Blueprint, render_template, session, redirect, url_for, request, current_app, jsonify, abort
from ..database.repository.blog_repo import BlogService, BlogCommentService
from ..static.uploads import save_image


blog_service = BlogService()
blog_comment_service = BlogCommentService()

user_bp = Blueprint('user', __name__,  static_folder='static', template_folder='templates', url_prefix='/usr')


@user_bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@user_bp.route('/writezone')
def write_zone():
    return render_template('writezone.html')

@user_bp.route('/readzone')
def read_zone():
    return render_template('readzone.html')

@user_bp.route('/blog/<int:blog_id>')
def blog_detail(blog_id : int):
    blog = blog_service.get(blog_id)
    if not blog:
        abort(404)

    # Prepare a lightweight dict to pass to template
    blog_data = {
        'id': blog.id,
        'title': blog.title,
        'content': blog.content or '',
        'excerpt': (blog.seo_description or '')[:200],
        'author_name': getattr(blog.author, 'username', 'Unknown'),
        'category': blog.category,
        'tags': (blog.tags.split(',') if blog.tags else []),
        'featured_image': blog.featured_image_path,
        'created_at': blog.created_at.strftime('%b %d, %Y') if getattr(blog, 'created_at', None) else '',
        'current_user': session.get('username')
    }

    return render_template('blog_detail.html', blog_data=blog_data)

@user_bp.route('/blog/<int:blog_id>/comments', methods = ['GET'])
def blog_comment(blog_id : int):
    blog = blog_service.get(blog_id)

    if not blog:
        return jsonify({'success': False, 'error': 'Post not found'}), 404

    root_comments = blog_comment_service.get_blog_comments(blog_id = blog_id)
    
    comments_data = []
    for comment in root_comments:
        comments_data.append({
            'id': comment.id,
            'content': comment.content,
            'author': comment.user.username, # Lấy từ relationship user
            'created_at': comment.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            'total_likes': comment.total_likes,
            'reply_count': comment.replies.count() # Đếm số reply của comment này
        })

    return jsonify({'success': True, 'comments': comments_data}), 200



@user_bp.route('/blog/<int:blog_id>/update_comment', methods = ['POST'])
def comment_update(blog_id : int):

    blog = blog_service.get(blog_id)
    if not blog:
        return jsonify({'success': False, 'error': 'Blog not found'}), 404
    
    data = request.get_json()

    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    content = data.get('text')
    parent_id = data.get('parent_id', None) # Có thể là None (comment gốc) hoặc ID (reply)

    if not content:
        return jsonify({'success': False, 'error': 'Comment content is required'}), 400
    

    new_comment = blog_comment_service.add_comment(blog_id=blog_id, user_id=session['user_id'], 
                                                   content = content, parent_id=parent_id)

    if not new_comment:
        return jsonify({'success': False, 'error': 'Lỗi server khi lưu bình luận'}), 500
    

    return jsonify({
            'success': True,
            'comment': {
                'id': new_comment.id,
                'content': new_comment.content,
                'author': session.get('username', 'User'),
                'parent_id': new_comment.parent_id,
                'total_likes': new_comment.total_likes,
                'created_at': new_comment.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                'reply_count' : new_comment.replies.count()

            }
        }), 201



@user_bp.route('/blog/comment/<int:parent_id>/replies', methods=['GET'])
def get_replies(parent_id : int):
    parent = blog_comment_service.get_comment_by_id(comment_id = parent_id)
    
    if not parent:
        return jsonify({'success': False, 'error': 'Comment not found'}), 404
    
    replies_data = []
    for r in parent.replies: # parent.replies là dynamic query
        replies_data.append({
            'id': r.id,
            'content': r.content,
            'author': session.get('username', 'User'),
            'parent_id': r.parent_id,
            'total_likes': r.total_likes,
            'created_at': r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            'reply_count' : r.replies.count()
        })
        
    return jsonify({'success': True, 'replies': replies_data})


@user_bp.route('/writezone', methods=['POST'])
def submit_blog():
    user_id = session.get("user_id")

    if not user_id:
        return redirect(url_for("auth.login"))

    title = request.form.get("title")
    content = request.form.get("content")
    category = request.form.get("category")
    tags = request.form.get("tags")
    seo_description = request.form.get("seo_description")
    publish_option = request.form.get("publish_option")

    featured_image = request.files.get("featured_image")

    image_path = save_image(featured_image, user_id)

    blog_data = {
        "user_id": user_id,
        "title": title,
        "content": content,
        "category": category,
        "tags": tags,
        "seo_description": seo_description,
        "featured_image_path": image_path,
        "status": "published" if publish_option == "publish" else "draft"
    }

    blog_service.create(blog_data)
    return redirect(url_for("user.dashboard"))



from flask import session, jsonify, render_template

@user_bp.route('/blog/personal', methods=['GET'])
def personal_blog():
    # 1. Kiểm tra login
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    # 2. Lấy danh sách blog của user từ database thông qua service
    # Giả sử blog_service.list_by_author trả về list các object Blog
    all_blogs = blog_service.list_by_author(user_id=session['user_id'])

    # 3. Phân loại blog: Đã đăng và Bản nháp (nếu model có field is_published)
    # Nếu model của bạn chưa có field này, chúng ta lấy tất cả vào 'posts'
    blogs_data = []
    drafts_data = []

    for blog in all_blogs:
        blog_dict = {
            'id': blog.id,
            'title': blog.title,
            # Cắt ngắn nội dung làm excerpt (khoảng 150 ký tự)
            'excerpt': (blog.content[:150] + '...') if len(blog.content) > 150 else blog.content,
            'date': blog.created_at.strftime("%b %d, %Y"),
            # Lấy stats từ relationship (nếu có)
            'views': blog.stats.total_views if blog.stats else 0,
            'likes': blog.stats.total_likes if blog.stats else 0,
            'comments': blog.stats.total_comments if blog.stats else 0
        }
        
        # Giả sử bạn có thuộc tính is_published trong model
        if getattr(blog, 'is_published', True):
            blogs_data.append(blog_dict)
        else:
            drafts_data.append(blog_dict)

    # 4. Trả về JSON
    return jsonify({
        'success': True,
        'blogs': blogs_data,
        'drafts': drafts_data,
        'username': session.get('username'),
        # Bạn có thể tính tổng stats ở đây để đổ vào các ô Quick Stats

        'total_stats': {
            'blogs': len(blogs_data),
            'views': sum(p['views'] for p in blogs_data),
            'likes': sum(p['likes'] for p in blogs_data),
            'comments': sum(p['comments'] for p in blogs_data)
        }
    })