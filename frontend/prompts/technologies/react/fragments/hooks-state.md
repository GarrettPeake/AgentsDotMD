---
id: react-hooks-state
technology: react
category: state-management
optionDependencies:
  state-management: hooks
sortOrder: 200
version: 1
---

## React Hooks State Management

- Use `useState` for local component state and `useReducer` for complex state logic.
- Lift state up only when two or more sibling components need the same data.
- Use React Context sparingly — only for truly global concerns (theme, auth, locale).
- Avoid putting derived data in state. Compute it during render or use `useMemo`.
- Custom hooks should start with `use` and encapsulate a single concern.
