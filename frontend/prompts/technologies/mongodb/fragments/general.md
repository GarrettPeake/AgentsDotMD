---
id: mongodb-general
technology: mongodb
category: general
sortOrder: 100
version: 1
---

## MongoDB Conventions

- Use `camelCase` for collection names and field names. Pluralize collection names (e.g., `users`, `orders`).
- Always include a `_id` field. Let MongoDB generate ObjectIds unless a natural key makes more sense.
- Design schemas around query patterns, not around entity relationships. Embed related data when it is read together; reference it when it is large or shared across collections.
- Avoid deeply nested documents (more than 3 levels). Flatten structures when nesting adds complexity without query benefits.
- Use the aggregation pipeline for complex queries instead of pulling data to the application layer.
- Create indexes for fields used in queries, sorts, and filters. Use `explain()` to verify index usage and query performance.
- Add compound indexes that match your most common query patterns. Field order in the index matters — follow the equality-sort-range rule.
- Use schema validation rules (`$jsonSchema`) to enforce required fields, data types, and value constraints at the database level.
- Store connection strings and credentials in environment variables. Never hardcode them in application code.
- Use transactions only when atomicity across multiple documents or collections is required. Single-document operations are already atomic.
- Set appropriate write concern and read preference based on your consistency and availability requirements.
- Use `bulkWrite` for batch insert, update, and delete operations to minimize round trips.
