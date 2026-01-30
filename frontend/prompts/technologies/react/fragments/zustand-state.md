---
id: react-zustand-state
technology: react
category: state-management
optionDependencies:
  state-management: zustand
sortOrder: 200
version: 1
---

## Zustand State Management

- Create one store per domain concern (e.g., `useAuthStore`, `useCartStore`).
- Keep store definitions in a `stores/` directory, one file per store.
- Use selectors to subscribe to specific slices of state and avoid unnecessary re-renders.
- Use Zustand's `immer` middleware for complex nested state updates.
- Do not access stores outside of React components — prefer passing data as props or using hooks.
