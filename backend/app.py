import os
from pathlib import Path

from flask import Flask, jsonify, render_template, send_from_directory, abort
from flask_cors import CORS

import config
from extensions import limiter, csrf, db
from utils.security import add_security_headers
from utils.logger import get_logger

from routes.health import bp as health_bp
from routes.events import bp as events_bp
from routes.registration import bp as registration_bp
from routes.auth import bp as auth_bp
from routes.admin_auth import bp as admin_auth_bp
from routes.admin_pages import bp as admin_pages_bp
from routes.admin_api import bp as admin_api_bp
from routes.frontend import bp as frontend_bp


logger = get_logger("app")


def create_app() -> Flask:
    app = Flask(__name__)

    app.config["SECRET_KEY"] = config.SECRET_KEY
    app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH
    app.config["SESSION_COOKIE_SECURE"] = config.SESSION_COOKIE_SECURE
    app.config["SESSION_COOKIE_HTTPONLY"] = config.SESSION_COOKIE_HTTPONLY
    app.config["SESSION_COOKIE_SAMESITE"] = config.SESSION_COOKIE_SAMESITE
    app.config["PERMANENT_SESSION_LIFETIME"] = (
        config.PERMANENT_SESSION_LIFETIME_SECONDS
    )
    app.config["SQLALCHEMY_DATABASE_URI"] = config.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = (
        config.SQLALCHEMY_TRACK_MODIFICATIONS
    )

    limiter.init_app(app)
    csrf.init_app(app)
    db.init_app(app)

    with app.app_context():
        import models  # noqa: F401
        db.create_all()

    # Public API is meant to be called cross-origin from the marketing frontend.
    # /api/auth/* and /api/registrations use session cookies, so credentials
    # are enabled only for the explicitly allowed frontend origins.
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "https://www.cybercarnival.in",
                    "https://cybercarnival.in",
                ]
            }
        },
        supports_credentials=True,
    )

    app.register_blueprint(health_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(registration_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_auth_bp)
    app.register_blueprint(admin_pages_bp)
    app.register_blueprint(admin_api_bp)
    app.register_blueprint(frontend_bp)  # catch-all — must stay last

    # These public endpoints are called by client-side JS on a different
    # origin than the admin panel, so they cannot carry a Flask-WTF CSRF token.
    # Protection is provided by SameSite cookies, strict CORS origin
    # allow-listing, and per-route rate limiting.
    csrf.exempt(registration_bp)
    csrf.exempt(auth_bp)

    @app.get("/uploads/posters/<path:filename>")
    def uploaded_poster(filename):
        # Extra safety net on top of secure_filename() at upload time.
        target = (config.UPLOAD_DIR / filename).resolve()

        try:
            target.relative_to(config.UPLOAD_DIR.resolve())
        except ValueError:
            abort(404)

        if not target.is_file():
            abort(404)

        return send_from_directory(config.UPLOAD_DIR, filename)

    app.after_request(add_security_headers)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "not found"}), 404

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({"error": "request body too large"}), 413

    @app.errorhandler(429)
    def rate_limited(e):
        return jsonify({"error": "too many requests, slow down"}), 429

    @app.errorhandler(500)
    def server_error(e):
        logger.exception("unhandled server error")
        return jsonify({"error": "internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    host = os.environ.get(
        "HOST",
        "127.0.0.1" if not config.IS_PRODUCTION else "0.0.0.0",
    )

    app.run(
        host=host,
        port=port,
        debug=not config.IS_PRODUCTION,
    )
