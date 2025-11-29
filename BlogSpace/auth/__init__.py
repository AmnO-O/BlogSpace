from flask import Blueprint, render_template, request, session, redirect, url_for
from ..database.repository.user_repo import UserService

user_service = UserService()
auth_bp = Blueprint('auth', __name__, template_folder = 'templates', 
                    static_folder='static', url_prefix='/auth')

@auth_bp.route('/login')
def login():
    return render_template('login.html')

@auth_bp.route('/signup')
def signup():
    return render_template('signup.html')

@auth_bp.route('/logout')
def logout():
    session.clear(); 
    return render_template('signup.html')



@auth_bp.route('/signup', methods=['POST'])
def signup_post():
    if "user_id" in session: 
        return redirect(url_for('homepage'))
    
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    confirm = request.form.get('confirm_password')

    errors = {}

    if not username:
        errors['username'] = 'Vui lòng nhập username!'
    if not email:
        errors['email'] = 'Vui lòng nhập email!'
    if not password:
        errors['password'] = 'Vui lòng nhập mật khẩu!'
    if password != confirm:
        errors['confirm'] = 'Mật khẩu xác nhận không khớp!'

    if not errors:
        success, message = user_service.register_user(
            username=username,
            email=email,
            password=password
        )
        if not success:
            errors['email'] = message

    if errors:
        return render_template('signup.html', errors=errors, form_data=request.form)

    return redirect(url_for('auth.login'))

from werkzeug.security import check_password_hash

@auth_bp.route('/login', methods=['POST'])
def login_post():
    if "user_id" in session:
        return redirect(url_for("homepage"))

    email = request.form['email']
    password = request.form['password']

    user = user_service.authenticate_user(email, password)

    if user is None:
        return render_template('login.html', error="Email hoặc mật khẩu không đúng!")

    session.clear()
    session.permanent = True
    session["user_id"] = str(user.id)
    session["username"] = user.username

    return redirect(url_for('user.dashboard'))
