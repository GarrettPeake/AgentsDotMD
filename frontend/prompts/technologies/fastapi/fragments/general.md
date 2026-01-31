---
id: fastapi-general
technology: fastapi
category: general
sortOrder: 100
version: 1
---

## FastAPI Conventions

- Structure the project with a clear separation of concerns: `app/` for the main application, `app/routers/` for route modules, `app/models/` for Pydantic and ORM models, `app/services/` for business logic, and `app/schemas/` for request/response schemas.
- Define the FastAPI application instance in `app/main.py`. Mount routers using `app.include_router()` with appropriate prefixes and tags.
- Use Pydantic models (BaseModel) for all request bodies, response schemas, and configuration. Leverage automatic validation and serialization.
- Define path operations with explicit response models using the `response_model` parameter. Document endpoints with docstrings — FastAPI generates OpenAPI docs automatically.
- Use dependency injection via `Depends()` for shared logic: database sessions, authentication, authorization, configuration access.
- Prefer `async def` for endpoints that perform I/O (database queries, HTTP calls). Use regular `def` for CPU-bound operations.
- Handle errors with `HTTPException` for expected errors and custom exception handlers registered via `@app.exception_handler()` for domain-specific errors.
- Use environment variables for configuration. Load them with `pydantic-settings` (BaseSettings) for typed, validated configuration with `.env` file support.
- Return consistent response shapes. Use Pydantic response models to enforce structure. Set appropriate HTTP status codes (200, 201, 204, 400, 401, 404, 422, 500).
- Use middleware for cross-cutting concerns: CORS (`CORSMiddleware`), request logging, timing. Register middleware with `app.add_middleware()`.
- Write tests with `pytest` and `httpx` (AsyncClient) for endpoint testing. Use `TestClient` from `starlette.testclient` for synchronous tests. Place tests in a `tests/` directory mirroring the app structure.
- Use `alembic` for database migrations when using SQLAlchemy. Keep migration scripts in version control.
- Use `uvicorn` as the ASGI server. Define a `uvicorn.run()` call in `__main__.py` for development and use `uvicorn app.main:app --reload` for hot-reloading.
- Pin dependencies in `requirements.txt` or use `pyproject.toml` with `pip-tools` or `poetry` for reproducible builds.
