import logging
from flask import jsonify

logger = logging.getLogger("student_api")


def register_error_handlers(app):

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            "error": getattr(error, "description", "Bad request")
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            "error": "Authentication required or invalid credentials"
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            "error": "Access forbidden: insufficient permissions"
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Resource not found"
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "Method not allowed"
        }), 405

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            "error": "Uploaded file is too large. Maximum allowed size is 16MB"
        }), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        logger.exception("Unhandled server error: %s", error)
        return jsonify({
            "error": "Internal server error"
        }), 500