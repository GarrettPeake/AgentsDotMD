---
id: python-django
technology: python
category: framework
optionDependencies:
  framework: django
sortOrder: 200
version: 1
---

## Django Conventions

- Follow the "fat models, thin views" pattern. Business logic belongs in model methods and managers.
- Use class-based views for standard CRUD. Use function-based views for custom or simple endpoints.
- Define all database queries in model managers or querysets, not in views.
- Use Django REST Framework for API endpoints. Define serializers for all request/response shapes.
- Run `makemigrations` and `migrate` as separate steps. Review generated migrations before applying.
