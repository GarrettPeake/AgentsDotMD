---
id: tailwindcss-general
technology: tailwindcss
category: general
sortOrder: 100
version: 1
---

## Tailwind CSS Conventions

- Use utility classes directly in markup. Avoid writing custom CSS unless absolutely necessary.
- Extract repeated utility patterns into components, not into `@apply` directives. Prefer composition over abstraction.
- Use the `@theme` directive (v4) or `tailwind.config.js` (v3) for design tokens: colors, spacing, fonts, and breakpoints.
- Follow mobile-first responsive design. Use `sm:`, `md:`, `lg:`, `xl:` breakpoint prefixes from smallest to largest.
- Keep class lists readable: group related utilities (layout, spacing, typography, color) and use consistent ordering.
- Use semantic color names in your theme (e.g., `primary`, `destructive`, `muted`) rather than raw color scales in components.
- Leverage Tailwind's built-in dark mode support with the `dark:` variant. Define both light and dark values for all themed elements.
- Avoid `!important` overrides. If specificity conflicts arise, restructure the component hierarchy instead.
