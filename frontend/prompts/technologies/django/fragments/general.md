---
id: django-general
technology: django
category: general
sortOrder: 100
version: 1
---

## Django Conventions

- Follow Django's "fat models, thin views" pattern. Keep business logic in models and managers, not views.
- Use class-based views (CBVs) for standard CRUD operations; use function-based views for simple or highly custom endpoints.
- Define all URL patterns in `urls.py` files. Use `app_name` and `name` for reverse URL lookups.
- Use Django's ORM for all database access. Avoid raw SQL unless there is a clear performance need.
- Keep each Django app focused on a single domain concern. Use `apps.py` for app configuration.
- Use Django's built-in `settings.py` for configuration. Split settings into `base.py`, `development.py`, and `production.py` for environment-specific overrides.
- Run `python manage.py makemigrations` and `python manage.py migrate` after any model change. Never edit migration files by hand unless resolving conflicts.
- Use Django's `TestCase` for unit tests and `LiveServerTestCase` for integration tests. Place tests in a `tests/` directory within each app.
- Prefer `{% url %}` and `{% static %}` template tags over hardcoded paths.
- Use Django's form and serializer validation rather than manual validation in views.
