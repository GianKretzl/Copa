from datetime import datetime

from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db, login_manager


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    collection_items = db.relationship("CollectionItem", back_populates="user")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Sticker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    team = db.Column(db.String(120), nullable=False)
    group = db.Column(db.String(20), nullable=True)
    name = db.Column(db.String(120), nullable=True)

    collection_items = db.relationship("CollectionItem", back_populates="sticker")


class CollectionItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    sticker_id = db.Column(db.Integer, db.ForeignKey("sticker.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="collection_items")
    sticker = db.relationship("Sticker", back_populates="collection_items")


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
