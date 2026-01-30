---
id: react-testing
technology: react
category: testing
optionDependencies:
  use-testing: true
sortOrder: 300
version: 1
---

## React Testing Conventions

- Write tests using React Testing Library and Jest (or Vitest).
- Test behavior, not implementation details. Query by role, label, or text — not by class or test ID.
- Each component should have a `.test.tsx` file co-located in the same directory.
- Test user interactions: clicks, form submissions, keyboard navigation.
- Mock external dependencies (API calls, routing) at the boundary, not deep inside components.
