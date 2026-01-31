---
id: docker-general
technology: docker
category: general
sortOrder: 100
version: 1
---

## Docker Conventions

- Use official base images and pin them to specific version tags (e.g., `node:20-alpine`), never use `latest` in production Dockerfiles.
- Keep images small by using Alpine-based or slim variants. Remove build dependencies and caches in the same `RUN` layer they are installed.
- Order Dockerfile instructions from least to most frequently changed to maximize build cache hits. Copy dependency files before source code.
- Use `.dockerignore` to exclude `node_modules`, `.git`, build artifacts, and secrets from the build context.
- Run containers as a non-root user. Add a `USER` instruction after installing dependencies.
- Use `COPY` instead of `ADD` unless you specifically need tar extraction or URL fetching.
- Define `HEALTHCHECK` instructions for production containers so orchestrators can detect unhealthy instances.
- Use environment variables for configuration. Never bake secrets or credentials into images.
- Label images with metadata using `LABEL` instructions (maintainer, version, description).
- Use `EXPOSE` to document which ports the container listens on, even though it does not publish them.
