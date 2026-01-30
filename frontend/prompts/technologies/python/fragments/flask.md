---
id: python-flask
technology: python
category: framework
optionDependencies:
  framework: flask
sortOrder: 200
version: 1
---

## Flask Conventions

- Use Blueprints to organize routes by feature or domain area.
- Use Flask's application factory pattern (`create_app()`) for configuration and testability.
- Define configuration in a separate module or environment variables, not inline in app code.
- Use Flask-SQLAlchemy for ORM access and Flask-Migrate for database schema management.
- Return JSON responses using `jsonify()`. Set appropriate status codes explicitly.
