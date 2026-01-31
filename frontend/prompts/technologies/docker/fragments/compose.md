---
id: docker-compose
technology: docker
category: compose
sortOrder: 300
version: 1
optionDependencies:
  compose: true
---

## Docker Compose Conventions

- Use `docker-compose.yml` for the base configuration and `docker-compose.override.yml` for local development overrides. Never commit the override file.
- Define all services with explicit `container_name` values for predictable naming in logs and debugging.
- Use named volumes for persistent data (databases, uploads). Avoid bind mounts in production.
- Set `restart: unless-stopped` for production services so containers recover after crashes or host reboots.
- Use `depends_on` with `condition: service_healthy` to express startup order based on health checks, not just container startup.
- Define a shared network explicitly rather than relying on the default network. Name it descriptively.
- Use `.env` files for environment variables and reference them with `env_file` in the compose file. Keep `.env` out of version control.
- Pin image versions in compose files the same way as in Dockerfiles. Avoid `latest` tags.
- Use `profiles` to group optional services (e.g., monitoring, debugging) that are not needed in every environment.
