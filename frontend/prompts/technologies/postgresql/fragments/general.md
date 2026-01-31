---
id: postgresql-general
technology: postgresql
category: general
sortOrder: 100
version: 1
---

## PostgreSQL Conventions

- Use `snake_case` for table names, column names, indexes, and all other identifiers.
- Always define a primary key on every table. Prefer `bigint generated always as identity` over `serial`.
- Use foreign key constraints to enforce referential integrity. Name them explicitly: `fk_{table}_{column}`.
- Write migrations for all schema changes. Never modify production schemas by hand.
- Use `timestamptz` (timestamp with time zone) instead of `timestamp` for all date/time columns.
- Prefer `text` over `varchar(n)` unless a hard length limit is a business rule.
- Add `NOT NULL` constraints by default. Only allow `NULL` when absence of a value is meaningful.
- Create indexes for columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses. Use `EXPLAIN ANALYZE` to verify.
- Use transactions for multi-statement operations. Keep transactions short to avoid lock contention.
- Store configuration and credentials in environment variables, not in SQL scripts or application code.
