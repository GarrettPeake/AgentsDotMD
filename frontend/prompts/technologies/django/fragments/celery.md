---
id: django-celery
technology: django
category: background-tasks
optionDependencies:
  use-celery: true
sortOrder: 300
version: 1
---

## Celery Background Tasks

- Configure Celery in a `celery.py` file at the project root, alongside `settings.py`.
- Define tasks in a `tasks.py` file within each app. Use the `@shared_task` decorator for reusability.
- Keep tasks idempotent and short-lived. Break long-running work into chains or groups.
- Use `apply_async` with explicit `countdown`, `eta`, or `queue` parameters rather than bare `delay()` when you need control over execution.
- Configure a result backend (Redis or database) only if you need to inspect task results. Disable it otherwise.
- Set `task_acks_late = True` and `task_reject_on_worker_lost = True` for at-least-once delivery guarantees.
- Monitor task health with Flower or Django Celery Results. Log task start, success, and failure events.
