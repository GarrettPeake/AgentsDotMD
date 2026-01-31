---
id: django-drf
technology: django
category: rest-api
optionDependencies:
  api-style: drf
sortOrder: 200
version: 1
---

## Django REST Framework

- Define serializers in a dedicated `serializers.py` per app. Use `ModelSerializer` for standard model representation.
- Use DRF's `ViewSet` and `Router` for RESTful endpoints. Prefer `ModelViewSet` for full CRUD.
- Configure authentication and permissions at the view or viewset level using `permission_classes` and `authentication_classes`.
- Use DRF's pagination, filtering (`django-filter`), and ordering backends instead of implementing them manually.
- Return appropriate HTTP status codes from `rest_framework.status`. Never return bare integers.
- Write API tests using DRF's `APITestCase` and `APIClient` for proper request simulation.
- Use `@action` decorator for custom endpoints on viewsets rather than separate views.
