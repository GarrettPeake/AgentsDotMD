# CLAUDE.md — AgentsDotMD Project Context

## Project Overview

AgentsDotMD is a stateless web tool that generates customized `AGENTS.md` / `CLAUDE.md` files for AI coding agents. Users select their tech stack, configure options, and receive a tailored markdown file with project conventions and best practices. The system is backed by a community-maintained, open-source prompt repository on GitHub.

There are no user accounts. GitHub OAuth is used only ephemerally for repository operations and prompt contributions.

## Current State

The project has completed its **initial implementation**. The full application is scaffolded and built per the DESIGN.md specification.

### What exists:

- `REQUIREMENTS.md` — Full functional and non-functional requirements
- `DESIGN.md` — Architecture and design document
- `CLAUDE.md` — This file (project context and development rules)
- `README.md` — Basic project readme
- `package.json` — npm package with wrangler devDependency
- `wrangler.toml` — Cloudflare Worker configuration with static asset routing
- `.github/workflows/deploy.yml` — CI/CD pipeline for Cloudflare Workers deployment

### Backend (Cloudflare Worker):
- `src/index.js` — Main fetch handler routing API vs static assets
- `src/routes/auth.js` — GitHub OAuth flow (redirect + callback with postMessage)
- `src/routes/github.js` — GitHub API proxy (repos, PRs, repo creation, App webhook/setup)
- `src/routes/contribute.js` — Community contribution endpoints (authenticated + anonymous)
- `src/utils/response.js` — JSON/error/CORS response helpers
- `src/utils/github-client.js` — GitHub REST API wrapper class

### Frontend Core:
- `frontend/index.html` — SPA shell with CSP headers
- `frontend/css/global.css` — Neo-brutalist design system with CSS custom properties
- `frontend/css/utilities.css` — Shared utility classes
- `frontend/js/store.js` — Reactive state store (pub/sub)
- `frontend/js/event-bus.js` — Cross-component event system
- `frontend/js/router.js` — Hash-based SPA router
- `frontend/js/app.js` — Entry point, component registration, router setup
- `frontend/js/github-auth.js` — OAuth client (popup + postMessage)
- `frontend/js/prompt-loader.js` — Manifest + fragment loader from GitHub
- `frontend/js/generator.js` — Markdown assembly engine (standard, inline, copy-paste modes)
- `frontend/js/template-engine.js` — {{variable}} interpolation with HTML escaping
- `frontend/js/zip-builder.js` — JSZip wrapper for zip downloads
- `frontend/js/diff.js` — Unified diff computation (LCS-based)

### Frontend Web Components (each = .html + .css + .js, strict language separation):
- `app-root` — Layout shell with header, router outlet, footer
- `workspace` — Single-page layout combining tech selection, options, and live assembled markdown preview with export toolbar
- `step-wizard` — 4-step progress indicator (legacy, no longer displayed in header)
- `toast-notification` — Popup notifications (success/error/info)
- `tech-catalog` — Technology grid with search and category filtering (embedded in workspace)
- `tech-card` — Individual technology card with toggle selection
- `option-panel` — Dynamic options form (single-select, toggle, freeform) with dependency logic
- `file-preview` — Markdown preview with inline editing and contribution suggestions
- `template-preview` — Template file viewer with collapsible entries
- `delivery-options` — Export step with download/inline/copy-paste modes
- `filename-selector` — Output filename dropdown (AGENTS.md, CLAUDE.md, custom)
- `github-commit` — GitHub PR creation form with repo selector
- `contribution-modal` — Modal for suggesting changes to prompt fragments

### Vendor:
- `frontend/vendor/jszip.min.js` — JSZip stub (replace with real library for production)

### UI Architecture:
The main interface is a **single-page workspace** layout (no multi-step wizard):
- **Left panel**: Technology selection grid with search/filters, plus inline options configuration
- **Right panel**: Live assembled markdown preview that updates in real-time as technologies are selected and options are configured
- **Export toolbar**: Compact button row (Copy, Download, GitHub) at the top of the preview panel
- The `workspace-view` component is the default route (`/`), embedding `tech-catalog`, `option-panel`, and `filename-selector` components
- The step-wizard has been removed from the header; navigation is no longer needed for the core workflow
- Routes `/configure`, `/preview`, `/export` still exist for backwards compatibility but the primary flow is single-page

### Next steps:
- Replace JSZip stub with the real JSZip library
- Set up Cloudflare Worker secrets (GITHUB_CLIENT_SECRET, GITHUB_BOT_TOKEN)
- Create the prompt repository (GarrettPeake/AgentsDotMD-prompts) with manifest.json and initial fragments
- Configure GitHub OAuth App and GitHub App
- Run `npm install` and `npx wrangler dev` for local development
- Test the full flow end-to-end
- Deploy to Cloudflare Workers

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Runtime** | Cloudflare Workers | Backend API + static asset serving |
| **Frontend hosting** | Cloudflare Static Asset Routing | SPA served via the worker's `[assets]` binding |
| **Frontend framework** | Native Web Components | Custom Elements v1 + Shadow DOM, no framework |
| **Styling** | Plain CSS (component-scoped files) | Loaded into Shadow DOM per component |
| **Templating** | Plain HTML files | Fetched and injected into Shadow DOM per component |
| **Client-side routing** | Hash-based router | Vanilla JS, no library |
| **State management** | Custom reactive store | Vanilla JS pub/sub pattern |
| **Zip generation** | JSZip | Client-side zip packaging |
| **GitHub integration** | GitHub REST API | OAuth + App, proxied through worker |
| **Prompt repository** | Public GitHub repo | Structured markdown fragments with YAML frontmatter |
| **CI/CD** | GitHub Actions | `wrangler deploy` on push to main |
| **Package manager** | npm | Standard Node.js tooling for worker development |

## Development Rules

### Keep CLAUDE.md Up to Date

**This file (`CLAUDE.md`) is the single source of truth for project context.** Whenever you make a change to the project — adding components, modifying the prompt library, changing the build process, adding new scripts, altering the project structure, or introducing new conventions — you MUST update `CLAUDE.md` to reflect those changes. Stale documentation misleads future contributors and agents. Treat updating this file as a mandatory part of every contribution, not an optional follow-up.

### Strict Language Separation for Web Components

Every web component consists of exactly three files:

- **`component-name.html`** — Pure HTML markup only. No `<style>` tags, no `<script>` tags, no inline styles, no inline event handlers.
- **`component-name.css`** — Pure CSS only. No JavaScript, no HTML. Scoped to the component via Shadow DOM.
- **`component-name.js`** — Pure JavaScript only. No CSS strings, no HTML template literals. JS fetches the `.html` and `.css` files and injects them into Shadow DOM.

This rule is absolute — no exceptions. Never put styling in JS or HTML files. Never put markup in JS files. Never put logic in HTML or CSS files.

### Client-Side Generation

All file generation logic (markdown assembly, template interpolation, zip packaging) runs in the browser. The backend worker handles only GitHub API integration:

- OAuth token exchange
- Repository listing
- Pull request creation
- Anonymous contribution submission

The backend never generates files, never processes prompt fragments, and never assembles markdown.

### Stateless Architecture

- No database (no D1, KV, R2, or Durable Objects)
- No session storage on the backend
- No cookies
- OAuth tokens held only in browser JS memory, never persisted
- No user accounts or profiles

### Visual Design — Neo-Brutalist Minimalism

The frontend uses a **minimalist, neo-brutalist** aesthetic. The design is intentionally stark, using bold typography, hard edges, and limited color to convey clarity and confidence.

**Color Palette:**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#FAF6F1` (parchment white) | Page and card backgrounds |
| `--color-text` | `#2B2B2B` (charcoal black) | All body text, headings |
| `--color-accent` | `#D94F04` (deep orange) | Buttons, links, selection highlights, active states |
| `--color-accent-hover` | `#B84303` (darker orange) | Hover/focus states for accent elements |
| `--color-border` | `#2B2B2B` (charcoal black) | Card borders, dividers — bold and visible |
| `--color-muted` | `#6B6B6B` (gray) | Secondary text, placeholders |
| `--color-surface` | `#FFFFFF` (white) | Elevated cards, modals |

**Neo-Brutalist Principles:**

- **Bold borders**: 2px+ solid black borders on cards, inputs, and buttons. No subtle 1px gray borders.
- **No border-radius** on primary elements (cards, buttons). Squared-off corners reinforce the brutalist feel. Minor radius (2px) allowed only on small inline elements like badges.
- **No drop shadows** for decoration. A solid offset shadow (e.g., `4px 4px 0 var(--color-text)`) may be used on buttons and cards for depth.
- **Bold typography**: Headings are large and heavy-weight. Use a monospace or geometric sans-serif font.
- **High contrast**: Accent color is used sparingly — for CTAs, active states, and key interactive elements only. The majority of the UI is black-on-white.
- **Flat design**: No gradients, no glossy effects. Solid fills only.
- **Generous whitespace**: Ample padding and margin. Content breathes.

### Prompt Repository as Data Source

The prompt library lives in a separate public GitHub repository. The frontend fetches `manifest.json` and fragment files directly from GitHub raw content URLs. Adding new technologies or prompt fragments requires only data file changes in that repository — no code changes or worker redeployment.

## Project Structure

```
AgentsDotMD/
├── REQUIREMENTS.md              # Product requirements
├── DESIGN.md                    # Architecture and design
├── CLAUDE.md                    # This file — project context
├── README.md                    # Project readme
├── wrangler.toml                # Cloudflare Worker configuration
├── package.json                 # Dependencies (wrangler, jszip)
├── src/                         # Worker backend source
│   ├── index.js                 # Main fetch handler (route API vs static)
│   ├── routes/
│   │   ├── auth.js              # GitHub OAuth flow
│   │   ├── github.js            # GitHub API proxy (repos, PRs)
│   │   └── contribute.js        # Community contribution endpoints
│   └── utils/
│       ├── github-client.js     # GitHub API wrapper
│       └── response.js          # Response helpers
├── frontend/                    # Static assets (SPA)
│   ├── index.html               # App shell
│   ├── css/
│   │   ├── global.css           # Reset, custom properties, typography
│   │   └── utilities.css        # Shared utility classes
│   ├── js/
│   │   ├── app.js               # Entry point, component registration
│   │   ├── router.js            # Hash-based SPA router
│   │   ├── store.js             # Reactive state store
│   │   ├── event-bus.js         # Cross-component pub/sub
│   │   ├── github-auth.js       # OAuth client module
│   │   ├── prompt-loader.js     # Fetches manifest + fragments from GitHub
│   │   ├── generator.js         # Markdown assembly engine
│   │   ├── template-engine.js   # {{variable}} interpolation
│   │   ├── zip-builder.js       # JSZip wrapper
│   │   └── diff.js              # Unified diff computation
│   ├── components/              # Web components (each = .html + .css + .js)
│   │   ├── app-root/
│   │   ├── workspace/
│   │   ├── tech-catalog/
│   │   ├── tech-card/
│   │   ├── option-panel/
│   │   ├── file-preview/
│   │   ├── template-preview/
│   │   ├── delivery-options/
│   │   ├── filename-selector/
│   │   ├── github-commit/
│   │   ├── contribution-modal/
│   │   ├── step-wizard/
│   │   └── toast-notification/
│   └── vendor/
│       └── jszip.min.js
└── .github/
    └── workflows/
        └── deploy.yml           # GitHub Actions: wrangler deploy on push to main
```

## Screenshot Automation

The project includes a Playwright-based screenshot tool in `automation/` for visual testing and auditing.

**Prerequisites before running screenshots:**
1. Build the prompt manifest: `node scripts/build-manifest.js`
2. Start the dev server: `npx wrangler dev` (run in background, wait for "Ready" output)
3. Then run the screenshotter against the running server

```bash
# Setup (one-time)
cd automation && npm install && npm run install-browsers && cd ..

# Prerequisites (must be done before screenshots)
node scripts/build-manifest.js
npx wrangler dev &  # start dev server in background, wait for it to be ready

# Run screenshots (dev server must be running)
cd automation && npm run screenshot && cd ..

# Or with a custom URL
cd automation && node screenshotter.js http://localhost:8787 && cd ..
```

Screenshots are saved to `automation/screenshots/` with descriptive filenames. Both desktop (1280x800) and mobile (390x844) viewports are captured. The `screenshots/` directory is gitignored.

**Use this tool to visually verify changes** — run the screenshotter after making UI changes, then read the screenshot images to confirm the changes look correct.

## Prompt Library & Manifest

The prompt library lives in `frontend/prompts/` and is the core data source for the application. The manifest file `frontend/prompts/manifest.json` is **generated** from the directory structure by the build script — never edit it by hand.

### Directory Structure

```
frontend/prompts/
├── manifest.json                          # GENERATED — do not edit manually
├── technologies/{tech-id}/
│   ├── meta.json                          # Name, description, categories, options, templates, gitignore
│   └── fragments/
│       ├── general.md                     # Core conventions (always included)
│       └── {feature}.md                   # Conditional fragments (included based on options)
├── combinations/{tech-a}+{tech-b}/
│   ├── meta.json                          # Which technologies, description
│   └── fragments/
│       └── integration.md                 # Integration-specific guidance
└── templates/{tech-id}/
    └── {filename}.tmpl                    # Template files with {{variable}} interpolation
```

### Building the Manifest

```bash
node scripts/build-manifest.js
```

This reads every `meta.json` and fragment file, extracts metadata (including YAML frontmatter from `.md` files), and writes `frontend/prompts/manifest.json`.

### IMPORTANT: Keep the Manifest Up to Date

**Every time you add, remove, or modify files in `frontend/prompts/`, you MUST re-run `node scripts/build-manifest.js` to regenerate the manifest.** The application loads `manifest.json` at runtime to discover technologies, options, and fragments. If the manifest is stale, the UI will not reflect your changes.

### Adding a New Technology

1. Create `frontend/prompts/technologies/{tech-id}/meta.json` with name, description, categories, options, etc.
2. Create `frontend/prompts/technologies/{tech-id}/fragments/general.md` with core conventions (use YAML frontmatter for id, category, sortOrder).
3. Add any conditional fragments (e.g., `testing.md`, `typing.md`) gated by option values.
4. Optionally add template files in `frontend/prompts/templates/{tech-id}/`.
5. Run `node scripts/build-manifest.js` to regenerate the manifest.

### Adding a Combination

1. Create `frontend/prompts/combinations/{tech-a}+{tech-b}/meta.json` listing the technology IDs.
2. Add fragment files describing integration conventions.
3. Run `node scripts/build-manifest.js` to regenerate the manifest.

## Key Commands

```bash
# Install dependencies
npm install

# Local development
npx wrangler dev

# Deploy to Cloudflare
npx wrangler deploy

# Rebuild prompt manifest after changing prompts
node scripts/build-manifest.js

# Set secrets
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GITHUB_BOT_TOKEN
npx wrangler secret put GITHUB_APP_PRIVATE_KEY
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/github` | GET | Start GitHub OAuth flow |
| `/api/auth/callback` | GET | OAuth callback, exchange code for token |
| `/api/github/repos` | GET | List user's repositories |
| `/api/github/pr` | POST | Create PR with generated files |
| `/api/github/create-repo` | POST | Create new repo with generated files |
| `/api/contribute/submit` | POST | Authenticated contribution (user's token) |
| `/api/contribute/anonymous` | POST | Anonymous contribution (bot token) |
| `/api/github-app/webhook` | POST | GitHub App webhook handler |
| `/api/github-app/setup` | GET | Post-installation redirect |
