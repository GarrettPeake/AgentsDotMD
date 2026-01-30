---
id: react-redux-state
technology: react
category: state-management
optionDependencies:
  state-management: redux
sortOrder: 200
version: 1
---

## Redux Toolkit State Management

- Use Redux Toolkit (`@reduxjs/toolkit`) exclusively. Do not write raw Redux boilerplate.
- Organize state by feature using `createSlice`. Place each slice in its feature directory.
- Use `createAsyncThunk` for async operations. Handle loading/error states in `extraReducers`.
- Use RTK Query for server state and data fetching instead of manual thunks where possible.
- Select state with typed selectors. Use `createSelector` from Reselect for derived data.
