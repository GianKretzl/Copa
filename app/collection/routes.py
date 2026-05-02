from flask import Blueprint, render_template
from flask_login import login_required


collection_bp = Blueprint("collection", __name__)


@collection_bp.route("/", methods=["GET"])
@login_required
def dashboard():
    return render_template("collection/dashboard.html")


@collection_bp.route("/repetidas", methods=["GET"])
@login_required
def repeated():
    return render_template("collection/repeated.html")
