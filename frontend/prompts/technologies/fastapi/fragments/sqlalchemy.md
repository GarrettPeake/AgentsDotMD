---
id: fastapi-sqlalchemy
technology: fastapi
category: database
sortOrder: 200
version: 1
when:
  use-sqlalchemy: true
---

## SQLAlchemy Integration

- Define a database session factory in `app/database.py` using `create_async_engine` and `async_sessionmaker` for async support, or `create_engine` and `sessionmaker` for synchronous usage.
- Create a `get_db` dependency that yields a database session and ensures cleanup via `try/finally`. Inject it into route handlers with `Depends(get_db)`.
- Define ORM models in `app/models/` inheriting from a shared `Base = declarative_base()`. Keep one model per file for complex schemas.
- Use Alembic for all schema changes. Never modify the database schema manually. Run `alembic revision --autogenerate -m "description"` to create migrations.
- Separate Pydantic schemas (for API I/O) from SQLAlchemy models (for database I/O). Map between them explicitly in service functions.
- Use SQLAlchemy's `select()` and `func` for queries rather than legacy Query API. Prefer explicit column selection for read-heavy endpoints.
