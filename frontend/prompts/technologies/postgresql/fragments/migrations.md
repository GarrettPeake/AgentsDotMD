---
id: postgresql-migrations
technology: postgresql
category: migrations
sortOrder: 200
version: 1
optionDependencies:
  use-migrations: true
---

## Migration Conventions

- Each migration file should be idempotent or guarded with `IF NOT EXISTS` / `IF EXISTS` checks.
- Name migration files with a sequential prefix and description: `001_create_users_table.sql`.
- Always include both `up` and `down` (rollback) logic for every migration.
- Test migrations against a copy of production data before deploying. Never skip staging.
- Keep migrations small and focused. One logical change per migration file.
- Never modify a migration that has already been applied to production. Create a new migration instead.
