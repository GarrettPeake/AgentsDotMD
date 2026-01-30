---
id: react-general
technology: react
category: general
sortOrder: 100
version: 1
---

## React Conventions

- Use functional components exclusively. Do not use class components.
- Prefer named exports for components. Use default exports only for page-level route components.
- Keep components small and focused. Extract reusable logic into custom hooks.
- Co-locate related files: place component, styles, tests, and types in the same directory.
- Use descriptive component names that reflect their purpose (e.g., `UserProfileCard`, not `Card`).
