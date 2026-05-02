from flask import Flask

from app.extensions import csrf, db, login_manager, migrate
from app.auth.routes import auth_bp
from app.main.routes import main_bp
from app.collection.routes import collection_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    csrf.init_app(app)
    login_manager.login_view = "auth.login"

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(collection_bp, url_prefix="/colecao")

    return app
