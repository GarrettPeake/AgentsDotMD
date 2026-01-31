---
id: tailwindcss-design-system
technology: tailwindcss
category: design-system
optionDependencies:
  use-design-system: true
sortOrder: 300
version: 1
---

## Tailwind CSS Design System Conventions

- Define a strict set of design tokens in the Tailwind config: colors, spacing scale, font sizes, border radii, and shadows.
- Restrict the color palette to project-approved values. Disable default colors if the project uses a fully custom palette.
- Use CSS custom properties for dynamic theming values that change at runtime (e.g., user-selected accent colors).
- Document the design system with a living style guide or Storybook that renders each token and component variant.
- Enforce consistency by limiting spacing and sizing to the defined scale. Avoid arbitrary values like `p-[13px]` unless truly one-off.
- Create reusable component classes only when a pattern appears three or more times with identical styling.
