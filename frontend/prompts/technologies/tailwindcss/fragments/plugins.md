---
id: tailwindcss-plugins
technology: tailwindcss
category: plugins
optionDependencies:
  use-plugins: true
sortOrder: 200
version: 1
---

## Tailwind CSS Plugin Conventions

- Use official plugins (`@tailwindcss/typography`, `@tailwindcss/forms`, `@tailwindcss/container-queries`) before writing custom plugins.
- When creating custom plugins, use the `plugin()` API and document each utility or component the plugin provides.
- Namespace custom plugin utilities to avoid collisions with core Tailwind classes (e.g., `app-scrollbar`, `app-gradient`).
- Test plugins with representative markup to verify they generate correct CSS at all breakpoints and variants.
- Keep plugin configuration minimal. Expose options through the theme rather than hardcoding values.
