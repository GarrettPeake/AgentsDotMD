# CLAUDE.md — AgentsDotMD Project Context

## Project Overview

AgentsDotMD is a stateless web tool that generates customized `AGENTS.md` / `CLAUDE.md` files for AI coding agents. Users select their tech stack, configure options, and receive a tailored markdown file with project conventions and best practices. The system is backed by a community-maintained, open-source prompt repository on GitHub.

There are no user accounts. GitHub OAuth is used only ephemerally for repository operations and prompt contributions.

## Current State

The project is in the **design phase**. The following artifacts exist:

- `REQUIREMENTS.md` — Full functional and non-functional requirements
- `DESIGN.md` — Architecture and design document
- `CLAUDE.md` — This file (project context and development rules)
- `README.md` — Basic project readme

No implementation code has been written yet. The next step is to scaffold the Cloudflare Worker project and begin building the frontend SPA and backend API routes.

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

## Key Commands

```bash
# Install dependencies
npm install

# Local development
npx wrangler dev

# Deploy to Cloudflare
npx wrangler deploy

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
