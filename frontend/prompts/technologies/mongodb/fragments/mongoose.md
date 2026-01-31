---
id: mongodb-mongoose
technology: mongodb
category: odm
sortOrder: 200
version: 1
condition:
  optionId: driver
  value: mongoose
---

## Mongoose ODM Conventions

- Define all schemas in dedicated files under a `models/` directory. One file per model.
- Use `mongoose.Schema` with explicit types and required fields. Set `timestamps: true` for automatic `createdAt` and `updatedAt` fields.
- Add custom validation at the schema level using `validate` properties rather than validating in route handlers.
- Use schema middleware (`pre` and `post` hooks) for cross-cutting concerns like hashing passwords, logging, or cascading deletes.
- Define virtual properties for computed fields instead of storing derived values.
- Create static methods on schemas for common query operations (e.g., `findByEmail`). Use instance methods for document-level logic.
- Use `lean()` on queries when you only need plain JavaScript objects, not full Mongoose documents, for better read performance.
- Use `populate()` sparingly. For high-traffic queries, denormalize data instead of relying on population.
- Handle connection events (`connected`, `error`, `disconnected`) and implement graceful reconnection logic.
- Always close the connection properly on application shutdown using `mongoose.connection.close()`.
