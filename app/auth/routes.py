from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_user, logout_user

from app.extensions import db
from app.models import User
from app.auth.forms import LoginForm, RegisterForm


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("collection.dashboard"))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data.lower()).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            return redirect(url_for("collection.dashboard"))

        flash("Email ou senha invalidos", "error")

    return render_template("auth/login.html", form=form)


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("collection.dashboard"))

    form = RegisterForm()
    if form.validate_on_submit():
        email = form.email.data.lower()
        if User.query.filter_by(email=email).first():
            flash("Email ja cadastrado", "error")
            return render_template("auth/register.html", form=form)

        user = User(email=email)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        login_user(user)
        return redirect(url_for("collection.dashboard"))

    return render_template("auth/register.html", form=form)


@auth_bp.route("/logout", methods=["POST"])
def logout():
    logout_user()
    return redirect(url_for("main.index"))
