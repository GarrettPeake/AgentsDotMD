---
id: docker-multi-stage
technology: docker
category: multi-stage
sortOrder: 200
version: 1
optionDependencies:
  multi-stage: true
---

## Multi-Stage Build Conventions

- Use multi-stage builds to separate build-time dependencies from the runtime image. The final stage should contain only the compiled binary or production artifacts.
- Name build stages with `AS` for clarity (e.g., `FROM node:20-alpine AS builder`). Reference stages by name, not index.
- Copy only the necessary artifacts from build stages using `COPY --from=builder`. Never copy the entire filesystem.
- Use a minimal base image (e.g., `alpine`, `distroless`, or `scratch`) for the final runtime stage.
- If building statically linked binaries, consider using `FROM scratch` as the final stage for the smallest possible image.
- Keep the number of stages manageable — typically a builder stage and a runtime stage. Add a test stage only if running tests during the build.
