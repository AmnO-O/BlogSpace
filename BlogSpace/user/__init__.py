from flask import Blueprint, render_template, session, redirect, url_for, request, current_app, jsonify, abort
from ..database.repository.blog_repo import BlogService
from ..static.uploads import save_image


blog_service = BlogService()

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

@user_bp.route('/blog/<int:post_id>/comment', methods=['POST'])
def post_comment(post_id: int):
    post = blog_service.get(post_id)
    if not post:
        return jsonify({'success': False, 'error': 'Post not found'}), 404

    data = request.get_json() or {}
    text = data.get('text') or request.form.get('text')
    parent_id = data.get('parent_id') or request.form.get('parent_id')
    if not text:
        return jsonify({'success': False, 'error': 'Empty comment'}), 400

    # No comment model currently — return the comment to the client to append locally.
    # Generate a lightweight id using timestamp to help client-side rendering uniquely.
    import time
    generated_id = int(time.time() * 1000)

    comment = {
        'id': generated_id,
        'author': session.get('username', 'You'),
        'text': text,
        'date': 'just now',
        'parent_id': int(parent_id) if parent_id is not None and str(parent_id).isdigit() else None
    }

    return jsonify({'success': True, 'comment': comment}), 201


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