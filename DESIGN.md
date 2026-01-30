# AgentsDotMD — Design Document

## 1. Architecture Overview

AgentsDotMD is a stateless web application built as a **Cloudflare Worker** serving both a **Single Page Application (SPA)** frontend and a lightweight backend API. The frontend is delivered via Cloudflare's **Static Asset Routing** on the worker. All file generation logic runs **client-side** in the browser. The backend exists solely to proxy GitHub API operations (OAuth, pull requests, repository operations) and to mediate anonymous prompt contributions.

```
┌──────────────────────────────────────────────────────────┐
│                   Cloudflare Worker                       │
│                                                          │
│  ┌────────────────────┐   ┌───────────────────────────┐  │
│  │  Static Assets     │   │  API Routes (/api/*)      │  │
│  │  (SPA Frontend)    │   │                           │  │
│  │                    │   │  /api/auth/github          │  │
│  │  index.html        │   │  /api/auth/callback        │  │
│  │  /css/*.css        │   │  /api/github/repos         │  │
│  │  /js/*.js          │   │  /api/github/pr            │  │
│  │  /components/*.html│   │  /api/github/create-repo   │  │
│  │  /components/*.css │   │  /api/contribute/submit    │  │
│  │  /components/*.js  │   │  /api/contribute/anonymous │  │
│  └────────────────────┘   └───────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
         │                            │
         │ (serves SPA)               │ (proxies to GitHub API)
         ▼                            ▼
    Browser (client-side           GitHub API
    generation engine)             - OAuth
                                   - Repos
    Fetches prompt repo            - Pull Requests
    data directly from             - Contents
    GitHub raw content
```

### Key Architectural Decisions

1. **Client-side generation**: All markdown assembly, template interpolation, and zip packaging happen in the browser. This satisfies NFR-400/NFR-401 (works even if backend is down) and NFR-100 (sub-2s generation).
2. **Backend only for GitHub**: The Cloudflare Worker API routes handle OAuth token exchange, PR creation, and anonymous contribution submission. No user data is stored (NFR-501). OAuth tokens are held only in memory for the duration of the operation (NFR-500).
3. **Prompt repository as source of truth**: The prompt library is a public GitHub repository. The client fetches a manifest and fragment files directly from GitHub raw content URLs (or a CDN cache). The backend is not involved in serving prompt data.
4. **Web Components SPA**: The frontend uses native Web Components with strict separation — HTML templates, CSS stylesheets, and JS logic are each in their own files. No CSS-in-JS, no inline styles in HTML, no HTML template literals in JS.

---

## 2. Frontend Architecture

### 2.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| Component model | Native Web Components (Custom Elements v1, Shadow DOM) |
| Routing | Client-side hash router (lightweight, no framework) |
| State management | Custom event bus + shared state store (vanilla JS) |
| Markdown rendering | Client-side markdown assembly (string concatenation of fragments) |
| Zip generation | JSZip (loaded as ES module) |
| Diff display | Simple unified-diff renderer (vanilla JS) |
| Styling | Component-scoped CSS files loaded via `<link>` in Shadow DOM |
| Templating | HTML files loaded via `fetch()` and injected into Shadow DOM |

### 2.2 File Structure

```
frontend/
├── index.html                          # Shell: loads router, defines <app-root>
├── css/
│   ├── global.css                      # CSS reset, custom properties (colors, spacing, typography)
│   └── utilities.css                   # Shared utility classes
├── js/
│   ├── app.js                          # Entry point: registers components, initializes router
│   ├── router.js                       # Hash-based SPA router
│   ├── store.js                        # Reactive state store (selections, options, fragments)
│   ├── event-bus.js                    # Pub/sub event system for cross-component communication
│   ├── github-auth.js                  # GitHub OAuth flow (redirect + token exchange via backend)
│   ├── prompt-loader.js                # Fetches manifest + fragments from GitHub raw content
│   ├── generator.js                    # Assembles markdown from selected fragments + options
│   ├── template-engine.js             # Variable interpolation for boilerplate templates
│   ├── zip-builder.js                  # Builds zip archive from generated files (uses JSZip)
│   └── diff.js                         # Computes and formats unified diffs for contribution flow
├── components/
│   ├── app-root/
│   │   ├── app-root.html               # Layout shell with <slot> for routed content
│   │   ├── app-root.css                # Top-level layout styles
│   │   └── app-root.js                 # Registers routes, renders nav + routed view
│   ├── tech-catalog/
│   │   ├── tech-catalog.html           # Grid/list of technology cards with search bar
│   │   ├── tech-catalog.css            # Catalog layout, card styles, search input
│   │   └── tech-catalog.js             # Fetches tech list, handles search/filter, emits selection
│   ├── tech-card/
│   │   ├── tech-card.html              # Single technology card (icon, name, description)
│   │   ├── tech-card.css               # Card styling, selected state
│   │   └── tech-card.js                # Toggle selection on click, dispatch event
│   ├── option-panel/
│   │   ├── option-panel.html           # Options form: radio groups, checkboxes, text inputs
│   │   ├── option-panel.css            # Form layout, fieldset styles
│   │   └── option-panel.js             # Renders options per technology, enforces constraints
│   ├── file-preview/
│   │   ├── file-preview.html           # Markdown preview with editable fragment blocks
│   │   ├── file-preview.css            # Preview pane, syntax highlighting, edit controls
│   │   └── file-preview.js             # Real-time generation, inline editing, diff tracking
│   ├── template-preview/
│   │   ├── template-preview.html       # Lists template/boilerplate files with content preview
│   │   ├── template-preview.css        # File tree styles, code block styling
│   │   └── template-preview.js         # Renders template files, handles delivery mode selection
│   ├── delivery-options/
│   │   ├── delivery-options.html       # Download zip / inline instructions / copy-paste prompt
│   │   ├── delivery-options.css        # Button group, radio card styles
│   │   └── delivery-options.js         # Handles delivery mode selection, triggers generation
│   ├── filename-selector/
│   │   ├── filename-selector.html      # Dropdown: AGENTS.md / CLAUDE.md / custom input
│   │   ├── filename-selector.css       # Select/input styles
│   │   └── filename-selector.js        # Manages filename state
│   ├── github-commit/
│   │   ├── github-commit.html          # Repo selector, path input, PR creation form
│   │   ├── github-commit.css           # Form styles, repo list
│   │   └── github-commit.js            # OAuth trigger, repo listing, PR submission via backend
│   ├── contribution-modal/
│   │   ├── contribution-modal.html     # Diff view, rationale input, submission path choice
│   │   ├── contribution-modal.css      # Modal overlay, diff styles, form layout
│   │   └── contribution-modal.js       # Handles suggest-change flow, calls backend API
│   ├── step-wizard/
│   │   ├── step-wizard.html            # Step indicator bar (select → configure → preview → export)
│   │   ├── step-wizard.css             # Step indicator, progress bar styles
│   │   └── step-wizard.js              # Manages wizard step state, navigation
│   └── toast-notification/
│       ├── toast-notification.html     # Notification popup
│       ├── toast-notification.css      # Toast positioning, animation
│       └── toast-notification.js       # Show/hide toast on events
└── vendor/
    └── jszip.min.js                    # JSZip library for client-side zip generation
```

### 2.3 Web Component Pattern

Each component follows the same pattern to maintain strict language separation:

**JS file** — defines the custom element class, fetches its HTML template and CSS, attaches Shadow DOM:

```js
// components/tech-card/tech-card.js
export class TechCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    const [html, css] = await Promise.all([
      fetch(new URL('./tech-card.html', import.meta.url)).then(r => r.text()),
      fetch(new URL('./tech-card.css', import.meta.url)).then(r => r.text())
    ]);

    const style = document.createElement('style');
    style.textContent = css;

    const template = document.createElement('template');
    template.innerHTML = html;

    this.shadowRoot.append(style, template.content.cloneNode(true));
    this._bind();
  }

  _bind() {
    // Query shadow DOM elements and attach event listeners
  }

  // ... component logic, no HTML strings, no CSS strings
}

customElements.define('tech-card', TechCard);
```

**HTML file** — pure markup, no `<style>` or `<script>` tags:

```html
<!-- components/tech-card/tech-card.html -->
<div class="card" part="card">
  <div class="card-icon">
    <slot name="icon"></slot>
  </div>
  <h3 class="card-title"><slot name="title"></slot></h3>
  <p class="card-description"><slot name="description"></slot></p>
</div>
```

**CSS file** — pure styles, scoped to the component:

```css
/* components/tech-card/tech-card.css */
:host {
  display: block;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

:host([selected]) .card {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}
```

### 2.4 Client-Side Router

The router uses hash-based navigation (`#/`, `#/configure`, `#/preview`, `#/export`) to avoid requiring server-side route handling. The Cloudflare Worker serves `index.html` for all non-API, non-asset routes as a fallback, but hash routing means this is rarely needed.

```js
// js/router.js
class Router {
  constructor(outlet) {
    this.outlet = outlet; // DOM element to render into
    this.routes = new Map();
    window.addEventListener('hashchange', () => this._resolve());
  }

  register(hash, componentTag) {
    this.routes.set(hash, componentTag);
  }

  _resolve() {
    const hash = location.hash.slice(1) || '/';
    const tag = this.routes.get(hash);
    if (tag) {
      this.outlet.innerHTML = '';
      this.outlet.appendChild(document.createElement(tag));
    }
  }

  start() {
    this._resolve();
  }
}
```

Routes:

| Hash | Component | Wizard Step |
|------|-----------|-------------|
| `#/` | `<tech-catalog>` | 1 — Select Technologies |
| `#/configure` | `<option-panel>` | 2 — Configure Options |
| `#/preview` | `<file-preview>` | 3 — Preview & Edit |
| `#/export` | `<delivery-options>` | 4 — Export / Commit |

### 2.5 State Store

A lightweight reactive store holds all application state. Components subscribe to slices of state and re-render when relevant data changes.

```js
// js/store.js
class Store {
  constructor() {
    this._state = {
      technologies: [],          // Available technologies from manifest
      selectedTechIds: [],       // User's selected technology IDs
      options: {},               // { techId: { optionId: value } }
      fragments: [],             // Loaded prompt fragments
      generatedMarkdown: '',     // Assembled output
      templateFiles: [],         // Boilerplate files for selected techs
      filename: 'AGENTS.md',    // Output filename
      deliveryMode: 'download',  // 'download' | 'inline' | 'copypaste'
      localEdits: {},            // { fragmentId: editedText }
      githubToken: null,         // Ephemeral, in-memory only
    };
    this._listeners = new Map();
  }

  get(key) { return this._state[key]; }

  set(key, value) {
    this._state[key] = value;
    this._notify(key);
  }

  subscribe(key, callback) {
    if (!this._listeners.has(key)) this._listeners.set(key, new Set());
    this._listeners.get(key).add(callback);
    return () => this._listeners.get(key).delete(callback); // unsubscribe
  }

  _notify(key) {
    const listeners = this._listeners.get(key);
    if (listeners) listeners.forEach(cb => cb(this._state[key]));
  }
}

export const store = new Store();
```

### 2.6 Prompt Loader

The prompt loader fetches data directly from the public GitHub repository that serves as the prompt library. It loads a manifest file that indexes all technologies, options, and fragments, then lazily loads fragment content as needed.

```
Prompt Repository Structure (GitHub):
prompts/
├── manifest.json              # Index of all technologies, options, fragments
├── technologies/
│   ├── flutter/
│   │   ├── meta.json          # Technology metadata, options, combinations
│   │   └── fragments/
│   │       ├── bloc-state.md
│   │       ├── riverpod.md
│   │       └── general.md
│   ├── cloudflare-workers/
│   │   ├── meta.json
│   │   └── fragments/
│   │       ├── worker-setup.md
│   │       └── d1-database.md
│   └── ...
├── combinations/
│   ├── flutter+cloudflare-workers/
│   │   ├── meta.json
│   │   └── fragments/
│   │       └── integration.md
│   └── ...
└── templates/
    ├── flutter/
    │   ├── pubspec.yaml.tmpl
    │   └── .gitignore.tmpl
    ├── cloudflare-workers/
    │   ├── wrangler.toml.tmpl
    │   ├── package.json.tmpl
    │   └── .gitignore.tmpl
    └── ...
```

The client fetches `manifest.json` on app load (satisfies NFR-101 — under 1s since it's a single small JSON file from CDN-cached GitHub raw content). Individual fragment markdown files are fetched on-demand when a technology is selected.

### 2.7 Client-Side Generation Engine

The generator assembles the final markdown by:

1. Collecting all applicable fragments based on selected technologies, options, and combinations.
2. Sorting fragments by: general first, then technology-specific (alphabetical by tech), then combination sections.
3. Applying option-dependent filtering (fragments with `option_dependencies` are included only if those options are active).
4. Injecting a header section listing selected technologies and options.
5. Joining fragment content with section headings.
6. Applying any local edits the user has made inline.

This is pure string operations — no backend call needed. Satisfies NFR-100 (sub-2s).

### 2.8 Template Engine & Zip Builder

**Template interpolation** replaces `{{variable}}` placeholders in `.tmpl` files with user-provided values (project name, package name, etc.). This runs entirely client-side.

**Zip builder** uses JSZip to package:
- The generated markdown file (with user-chosen filename).
- All template files for selected technologies (with variables interpolated).
- A composite `.gitignore` merging entries from all selected technologies.

The three delivery modes (FR-403):
- **Download as zip**: Triggers a browser download of the assembled zip.
- **Inline instructions**: Appends setup instructions to the markdown file itself (template contents embedded as code blocks with file paths).
- **Copy-paste prompt**: Generates a self-contained prompt that instructs an AI agent to create all files.

---

## 3. Backend Architecture (Cloudflare Worker API)

### 3.1 Worker Entry Point

The worker uses Cloudflare's static asset routing to serve the SPA for all non-API requests. API routes are handled by the worker's `fetch` handler.

```
worker/
├── wrangler.toml               # Cloudflare Worker config with static assets
├── src/
│   ├── index.js                # Main fetch handler: route API vs static
│   ├── routes/
│   │   ├── auth.js             # GitHub OAuth flow
│   │   ├── github.js           # GitHub API proxy (repos, PRs, contents)
│   │   └── contribute.js       # Anonymous contribution submission
│   └── utils/
│       ├── github-client.js    # GitHub API wrapper
│       └── response.js         # JSON response helpers
└── frontend/                   # Static assets (SPA), served by asset routing
    └── (see Section 2.2)
```

**`wrangler.toml`**:
```toml
name = "agentsdotmd"
main = "src/index.js"
compatibility_date = "2025-01-01"

[assets]
directory = "./frontend"
binding = "ASSETS"

[vars]
GITHUB_CLIENT_ID = ""
PROMPT_REPO_OWNER = "GarrettPeake"
PROMPT_REPO_NAME = "AgentsDotMD-prompts"

# Secrets (set via `wrangler secret put`):
# GITHUB_CLIENT_SECRET
# GITHUB_BOT_TOKEN (for anonymous contributions)
```

### 3.2 Routing

```js
// src/index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API routes
    if (url.pathname.startsWith('/api/')) {
      return handleApi(url, request, env);
    }

    // All other requests: serve static assets (SPA)
    return env.ASSETS.fetch(request);
  }
};

function handleApi(url, request, env) {
  const path = url.pathname;

  if (path === '/api/auth/github')        return authRedirect(env);
  if (path === '/api/auth/callback')      return authCallback(url, env);
  if (path === '/api/github/repos')       return listRepos(request, env);
  if (path === '/api/github/pr')          return createPR(request, env);
  if (path === '/api/github/create-repo') return createRepo(request, env);
  if (path === '/api/contribute/submit')  return submitContribution(request, env);
  if (path === '/api/contribute/anonymous') return submitAnonymous(request, env);

  return new Response('Not Found', { status: 404 });
}
```

### 3.3 API Endpoints

#### 3.3.1 GitHub OAuth

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/github` | GET | Redirects the user to GitHub's OAuth authorization URL with appropriate scopes (`repo`, `public_repo`). A `state` parameter is generated for CSRF protection. |
| `/api/auth/callback` | GET | Receives the OAuth callback from GitHub. Exchanges the authorization code for an access token via GitHub's token endpoint. Returns the token to the SPA via a redirect with the token in a URL fragment (not query parameter, so it's not sent to the server on subsequent requests). |

The token is stored **only in the browser's memory** (the `store` object). It is never persisted to localStorage, cookies, or any backend store. It is cleared when the user closes the tab or navigates away. This satisfies NFR-500.

#### 3.3.2 GitHub Repository Operations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/github/repos` | GET | Proxies `GET /user/repos` to list the authenticated user's repositories. Requires `Authorization: Bearer <token>` header. |
| `/api/github/pr` | POST | Creates a pull request on the target repository containing the generated file(s). The request body includes: `repo`, `filePath`, `content`, `branchName`, `commitMessage`, `prTitle`, `prBody`. The worker creates a branch, commits the file(s), and opens a PR. |
| `/api/github/create-repo` | POST | Creates a new repository and commits the generated files. Request body includes: `name`, `description`, `private`, `files` (array of `{path, content}`). |

All GitHub proxy endpoints validate that the `Authorization` header is present and forward it to the GitHub API. The worker never stores the token.

#### 3.3.3 Community Contribution

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/contribute/submit` | POST | Authenticated contribution. Receives the user's GitHub token and the proposed edit. Creates a branch and PR on the prompt repository attributed to the user. Request body: `token`, `fragmentId`, `originalContent`, `editedContent`, `rationale`, `type` (edit/new-fragment/new-tech). |
| `/api/contribute/anonymous` | POST | Anonymous contribution. Uses the bot account's token (`GITHUB_BOT_TOKEN` secret) to create a PR. Request body: same as above minus `token`. The PR description includes the user's rationale and notes that it was submitted anonymously. |

Both endpoints:
1. Create a new branch on the prompt repository (e.g., `contrib/<fragmentId>-<timestamp>`).
2. Commit the changed/new file to the branch.
3. Open a PR with the rationale in the description.
4. Return the PR URL to the client for display.

This satisfies FR-550 through FR-558.

### 3.4 GitHub App Integration

The GitHub App (FR-650–FR-657) is registered separately on GitHub and points back to the AgentsDotMD web UI.

**Installation flow**: The App is listed on the GitHub Marketplace. When installed, it registers a webhook endpoint on the worker:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/github-app/webhook` | POST | Receives GitHub App webhook events (installation, issue comments). |
| `/api/github-app/setup` | GET | Callback URL after App installation, redirects to the SPA with the installation context. |

**Trigger mechanisms**:
- **Repository UI button**: The App adds a link in the repository's toolbar (via GitHub's supported App surfaces). Clicking opens `https://agentsdotmd.com/#/?repo=owner/name&app=true`.
- **Comment command** (FR-657): When a user comments `/generate-agent-md` on an issue or PR, the webhook handler detects this and posts a reply comment linking to the wizard with the repo pre-selected.

**PR creation via App**: When triggered from the App flow, the worker uses the App's installation token (not the user's OAuth token) to create the PR. This means the PR is attributed to the AgentsDotMD bot, but the user initiated it.

---

## 4. Prompt Repository Schema

### 4.1 Manifest (`manifest.json`)

```json
{
  "version": "1.0.0",
  "technologies": [
    {
      "id": "flutter",
      "name": "Flutter",
      "description": "Google's UI toolkit for cross-platform apps",
      "icon": "flutter.svg",
      "categories": ["mobile", "frontend", "cross-platform"],
      "options": [
        {
          "id": "state-management",
          "label": "State Management",
          "type": "single-select",
          "choices": [
            { "id": "bloc", "label": "BLoC", "default": true },
            { "id": "riverpod", "label": "Riverpod" },
            { "id": "provider", "label": "Provider" }
          ]
        },
        {
          "id": "use-di",
          "label": "Dependency Injection",
          "type": "toggle",
          "default": false,
          "dependsOn": { "state-management": ["bloc", "riverpod"] }
        },
        {
          "id": "project-name",
          "label": "Project Name",
          "type": "freeform",
          "default": "my_flutter_app",
          "placeholder": "e.g., my_flutter_app"
        }
      ],
      "incompatibleWith": [],
      "combinationsWith": ["cloudflare-workers", "supabase"]
    }
  ],
  "combinations": [
    {
      "id": "flutter+cloudflare-workers",
      "technologies": ["flutter", "cloudflare-workers"],
      "description": "Flutter frontend with Cloudflare Workers backend"
    }
  ]
}
```

### 4.2 Fragment File

Each fragment is a markdown file with YAML frontmatter:

```markdown
---
id: flutter-bloc-state
technology: flutter
category: state-management
optionDependencies:
  state-management: bloc
sortOrder: 200
version: 1
---

## BLoC State Management

When using BLoC for state management in Flutter:

- Define state classes as sealed/abstract with concrete subclasses for each state...
- Use `Equatable` for state and event classes...
```

Fields:
- **id**: Unique identifier for the fragment.
- **technology**: Parent technology ID.
- **category**: Grouping category (for display and sorting).
- **optionDependencies**: Map of option ID → required value(s). Fragment is included only if all dependencies are satisfied.
- **sortOrder**: Numeric sort key. Lower numbers appear first. General fragments use 100, technology-specific use 200+, combination fragments use 500+.
- **version**: Integer version. Incremented when content changes. Enables FR-503.

### 4.3 Template File

Template files use `.tmpl` extension and support `{{variable}}` interpolation:

```toml
# wrangler.toml.tmpl
name = "{{project-name}}"
main = "src/index.ts"
compatibility_date = "2025-01-01"
```

Template metadata is defined in the technology's `meta.json`:

```json
{
  "templates": [
    {
      "sourcePath": "templates/cloudflare-workers/wrangler.toml.tmpl",
      "outputPath": "wrangler.toml",
      "variables": ["project-name"]
    }
  ],
  "gitignore": [
    "node_modules/",
    ".wrangler/",
    ".dev.vars"
  ]
}
```

---

## 5. Requirement Traceability

### 5.1 Technology Selection (FR-100 – FR-103)

| Requirement | Design Element |
|-------------|---------------|
| FR-100 | `<tech-catalog>` component renders the full technology list from `manifest.json`. |
| FR-101 | `<tech-card>` toggles selection; `store.selectedTechIds` tracks multi-select. |
| FR-102 | `prompt-loader.js` cross-references `manifest.combinations` when selections change; `<option-panel>` surfaces combination-specific options. |
| FR-103 | `manifest.technologies[].incompatibleWith` is checked on each selection change. `<tech-catalog>` disables or warns on incompatible cards. |

### 5.2 Option Selection (FR-200 – FR-204)

| Requirement | Design Element |
|-------------|---------------|
| FR-200 | `<option-panel>` dynamically renders option controls per selected technology from `manifest.technologies[].options`. |
| FR-201 | Option `type` field supports `single-select` (radio group), `toggle` (checkbox), `freeform` (text input). |
| FR-202 | Each option has a `default` value in the manifest. `store.options` is initialized with defaults. |
| FR-203 | `single-select` type inherently enforces mutual exclusivity. `<option-panel>` renders these as radio buttons. |
| FR-204 | `dependsOn` field in option schema. `<option-panel>` shows/hides options based on current selections. |

### 5.3 File Generation (FR-300 – FR-306)

| Requirement | Design Element |
|-------------|---------------|
| FR-300 | `generator.js` assembles a single markdown file client-side from selected fragments. |
| FR-301 | `generator.js` prepends a header section listing technologies, options, and generation timestamp. |
| FR-302 | Fragment `sortOrder` enforces ordering: general (100) → technology (200+) → combination (500+). |
| FR-303 | Fragments are pre-authored as well-structured markdown. Generator adds `## Section` headings between technology groups. |
| FR-304 | `<file-preview>` component renders the generated markdown in real-time as the user adjusts options. |
| FR-305 | `<delivery-options>` component provides a download button. For single file: direct `.md` download. For zip: JSZip-generated archive. |
| FR-306 | `<filename-selector>` component offers `AGENTS.md`, `CLAUDE.md`, or custom text input. Value stored in `store.filename`. |

### 5.4 Template / Starter Package (FR-400 – FR-404)

| Requirement | Design Element |
|-------------|---------------|
| FR-400 | `meta.json` per technology defines `templates[]` with source paths and output paths. |
| FR-401 | `template-engine.js` replaces `{{variable}}` placeholders with values from `store.options`. |
| FR-402 | `meta.json` per technology defines `gitignore[]` entries. `zip-builder.js` merges them into a composite `.gitignore`. |
| FR-403a | `zip-builder.js` creates a zip via JSZip containing the generated file + all template files + `.gitignore`. |
| FR-403b | `generator.js` has an `inlineMode()` that appends template file contents as fenced code blocks with file path headers. |
| FR-403c | `generator.js` has a `copyPasteMode()` that generates a meta-prompt instructing an AI agent to create all files. |
| FR-404 | `<template-preview>` component renders template files in a separate panel/tab from the main generated file preview. |

### 5.5 Prompt Repository Management (FR-500 – FR-505)

| Requirement | Design Element |
|-------------|---------------|
| FR-500 | Prompt repo is a Git repository with structured files (manifest + markdown fragments). |
| FR-501 | YAML frontmatter on each fragment contains: `technology`, `category`, `optionDependencies`, `sortOrder`, `version`. |
| FR-502 | Adding a new technology = adding a new directory + `meta.json` + fragments + updating `manifest.json`. No code changes needed. |
| FR-503 | `version` field in fragment frontmatter. Manifest records current version. Historical versions available via git history. |
| FR-504 | In-app contribution flow (FR-550+) and standard GitHub PR process. |
| FR-505 | The prompt repository is a public GitHub repository. |

### 5.6 Community Contribution (FR-550 – FR-558)

| Requirement | Design Element |
|-------------|---------------|
| FR-550 | `<file-preview>` renders each fragment block as editable. Clicking "Edit" switches a fragment to a `<textarea>`. |
| FR-551 | Edited fragments show a visual indicator (highlight / badge). A toggle distinguishes "local only" vs "suggest change". |
| FR-552 | "Suggest Change" button opens `<contribution-modal>`. |
| FR-553a | Modal offers "Sign in with GitHub" — uses OAuth flow, then calls `/api/contribute/submit` with the user's token. |
| FR-553b | Modal offers "Submit Anonymously" — calls `/api/contribute/anonymous`. Backend creates PR via bot account. |
| FR-554 | `<contribution-modal>` requires a rationale text field before submission. |
| FR-555 | `diff.js` computes a unified diff. `<contribution-modal>` displays it as a before/after or line-by-line diff view. |
| FR-556 | `<contribution-modal>` supports a "New Fragment" mode where the user specifies technology, category, and full content. |
| FR-557 | "New Fragment" mode includes fields for new option definitions or new technology metadata. Submitted as a PR adding new files. |
| FR-558 | All contributions result in GitHub PRs on the prompt repository. Merging is handled by repository maintainers. |

### 5.7 GitHub Integration (FR-600 – FR-605)

| Requirement | Design Element |
|-------------|---------------|
| FR-600 | `/api/auth/github` + `/api/auth/callback` implement OAuth. `github-auth.js` client module manages the flow. |
| FR-601 | `/api/github/pr` creates a branch + commit + PR on the user's repo. |
| FR-602 | `/api/github/repos` lists repos. `<github-commit>` component renders a repo selector. |
| FR-603 | `<github-commit>` component includes a file path text input (default: repo root). |
| FR-604 | `/api/github/create-repo` endpoint. `<github-commit>` component offers "Create new repository" option. |
| FR-605 | `/api/github/pr` checks if file exists at the target path. If so, the PR shows the diff. UI indicates "update existing file". |

### 5.8 GitHub App (FR-650 – FR-657)

| Requirement | Design Element |
|-------------|---------------|
| FR-650 | GitHub App registered and published on Marketplace. App manifest configured in GitHub. |
| FR-651 | App installs a link/button surface in the repository UI (GitHub-supported App features). |
| FR-652 | Link opens `https://agentsdotmd.com/#/?repo=owner/name&app=true`, loading the wizard with repo pre-selected. |
| FR-653 | Same `<step-wizard>` flow as standalone; `repo` query param pre-fills the export step. |
| FR-654 | PR created via the App's installation token through `/api/github-app/webhook` or the standard `/api/github/pr` flow. |
| FR-655 | GitHub App supports org-wide installation natively. |
| FR-656 | Wizard can be re-triggered at any time. If file exists, PR shows the update diff. |
| FR-657 | Webhook handler in `/api/github-app/webhook` detects `/generate-agent-md` in issue/PR comments and posts a reply with the wizard link. |

### 5.9 Web Interface (FR-800 – FR-804)

| Requirement | Design Element |
|-------------|---------------|
| FR-800 | SPA served via Cloudflare Worker static assets, accessible at the project's domain. |
| FR-801 | `<step-wizard>` component manages the 4-step flow: Select → Configure → Preview → Export. |
| FR-802 | `<tech-catalog>` includes a search input that filters by technology name, description, and categories. |
| FR-803 | `global.css` uses responsive design (CSS grid/flexbox, media queries). Components use relative units and fluid layouts. |
| FR-804 | `<file-preview>` subscribes to `store` changes and regenerates markdown in real-time as options toggle. |

### 5.10 Non-Functional Requirements

| Requirement | Design Element |
|-------------|---------------|
| NFR-100 | Client-side generation is pure string concatenation — sub-2s for any combination. |
| NFR-101 | `manifest.json` is a single small JSON file (~50KB for 100 technologies). Fetched from GitHub CDN. |
| NFR-200 | Manifest schema supports unlimited technologies and fragments. Fragments are lazily loaded. |
| NFR-201 | Stateless Cloudflare Worker scales automatically. Client-side generation offloads compute. |
| NFR-300 | New technology = new data files in the prompt repo. No code deployment needed. |
| NFR-301 | Fragment frontmatter schema is extensible (add new fields without breaking existing fragments). |
| NFR-302 | `generator.js` output format is parameterized. New formats can be added as output adapters. |
| NFR-400 | Core generation (manifest fetch + fragment assembly) works entirely client-side. GitHub features gracefully degrade. |
| NFR-401 | The SPA can function with cached manifest data if the network is unavailable. All generation is client-side. |
| NFR-500 | OAuth tokens are held only in `store.githubToken` (JS memory). Never persisted. Worker never stores tokens. |
| NFR-501 | No database, no session storage, no cookies. Fully stateless. |

---

## 6. Deployment

### 6.1 Infrastructure

| Component | Platform |
|-----------|----------|
| Worker + SPA | Cloudflare Workers (with static asset routing) |
| Prompt repository | GitHub public repository |
| Domain | Custom domain via Cloudflare DNS |
| Secrets | Cloudflare Worker secrets (`GITHUB_CLIENT_SECRET`, `GITHUB_BOT_TOKEN`) |

### 6.2 CI/CD

- Push to `main` triggers `wrangler deploy` via GitHub Actions.
- The prompt repository is independent — changes to prompts don't require a worker redeployment since the client fetches them directly from GitHub.

### 6.3 Environment Variables

| Variable | Type | Description |
|----------|------|-------------|
| `GITHUB_CLIENT_ID` | Var | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Secret | GitHub OAuth App client secret |
| `GITHUB_BOT_TOKEN` | Secret | Personal access token for bot account (anonymous contributions) |
| `PROMPT_REPO_OWNER` | Var | Owner of the prompt repository |
| `PROMPT_REPO_NAME` | Var | Name of the prompt repository |
| `GITHUB_APP_ID` | Var | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | Secret | GitHub App private key (for installation token generation) |

---

## 7. Security Considerations

1. **OAuth tokens are ephemeral**: Stored only in JS memory (`store.githubToken`). Never written to localStorage, sessionStorage, cookies, or any backend store. Cleared on tab close.
2. **CSRF protection**: OAuth `state` parameter is generated per-flow and validated on callback.
3. **Minimal scopes**: OAuth requests only `public_repo` scope (or `repo` if the user wants to access private repos, prompted explicitly).
4. **No user data storage**: The worker stores nothing. No database, no KV, no D1, no R2. Fully stateless.
5. **Bot token isolation**: The `GITHUB_BOT_TOKEN` secret is only used server-side for anonymous contributions. It is never exposed to the client.
6. **Content Security Policy**: The SPA sets a strict CSP header allowing only self-origin scripts and styles, plus GitHub raw content for fetching fragments.
7. **Input sanitization**: Template interpolation escapes values to prevent injection. Contribution submissions are sanitized before being committed to the prompt repo.
