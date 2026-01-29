# AgentsDotMD - Requirements Document

## 1. Product Overview

AgentsDotMD is a **fully open-source, stateless** tool that generates customized `AGENTS.md` / `CLAUDE.md` files — markdown files used by AI coding agents to understand project conventions, best practices, and technology-specific guidance. Users select their technology stack and configuration preferences, and the system produces a tailored file ready to drop into a new project.

There are **no user accounts**. The app is designed to be simple enough that saving presets or preferences is unnecessary — generating a file should be fast and frictionless every time. GitHub OAuth is used only when the user wants to commit to a repo or contribute an improvement back to the prompt library.

The system is backed by a curated, **community-maintained prompt repository** — an open-source collection of technology-specific directives, best practices, and integration guidance stored as files in a public Git repository. Anyone can contribute by editing prompts directly in the web UI (which creates a GitHub PR) or by contributing to the repository directly.

---

## 2. Core Concepts

### 2.1 Prompt Repository
- A structured collection of prompt fragments organized by technology and topic.
- Each fragment is a self-contained block of guidance (e.g., "How to structure BLoC state classes in Flutter").
- Fragments can be composed together to form a complete `AGENTS.md` or `CLAUDE.md` file.

### 2.2 Technology
- A top-level entity representing a framework, language, or platform (e.g., Flutter, Cloudflare Workers, Next.js, Rust).
- Each technology has its own set of prompt fragments and configurable options.

### 2.3 Technology Combination
- A pairing or grouping of two or more technologies that produces additional, integration-specific guidance (e.g., Flutter + Cloudflare Workers, Next.js + Drizzle ORM).
- Combination prompts supplement — not replace — the individual technology prompts.

### 2.4 Option
- A configurable choice within a technology that affects which prompt fragments are included.
- Options can be mutually exclusive (pick one: BLoC vs Riverpod) or independent toggles (enable/disable dependency injection guidance).

### 2.5 Template / Starter Package
- A set of boilerplate files associated with a technology or combination (e.g., `wrangler.toml`, `package.json`, directory scaffolding).
- Templates are an optional output alongside the generated file.

---

## 3. Functional Requirements

### 3.1 Technology Selection

| ID | Requirement |
|----|-------------|
| FR-100 | The system SHALL present a catalog of available technologies to the user. |
| FR-101 | The user SHALL be able to select one or more technologies for their project. |
| FR-102 | The system SHALL detect valid technology combinations and surface combination-specific options when applicable. |
| FR-103 | The system SHALL warn or prevent selection of known incompatible technology combinations. |

### 3.2 Option Selection

| ID | Requirement |
|----|-------------|
| FR-200 | For each selected technology, the system SHALL present the available options. |
| FR-201 | Options SHALL be typed as one of: single-select (pick one from a group), multi-select (toggle on/off), or freeform (user-provided value, e.g., project name). |
| FR-202 | Options SHALL have sensible defaults so a user can generate output without customizing every option. |
| FR-203 | The system SHALL enforce mutual exclusivity constraints (e.g., selecting BLoC disables Riverpod and vice versa). |
| FR-204 | The system SHALL support option dependencies — selecting one option may reveal or hide other options. |

### 3.3 File Generation

| ID | Requirement |
|----|-------------|
| FR-300 | The system SHALL generate a single markdown file (default: `AGENTS.md` or `CLAUDE.md`) based on the user's selections. These files are used by AI coding agents to understand project conventions and best practices. |
| FR-301 | The generated file SHALL include a header section identifying the selected technologies and options. |
| FR-302 | The generated file SHALL compose prompt fragments in a logical order: general project guidance first, then technology-specific sections, then integration/combination sections. |
| FR-303 | The generated file SHALL be well-structured markdown with clear headings and sections. |
| FR-304 | The user SHALL be able to preview the generated file before downloading. |
| FR-305 | The user SHALL be able to download the generated file. |
| FR-306 | The user SHALL be able to choose the output filename (`AGENTS.md`, `CLAUDE.md`, or custom). |

### 3.4 Template / Starter Package Generation

| ID | Requirement |
|----|-------------|
| FR-400 | Each technology or combination MAY define a set of template/boilerplate files (e.g., config files, directory structures, starter source files). |
| FR-401 | Template files SHALL support variable interpolation for user-provided values (e.g., project name, package name). |
| FR-402 | Each technology SHALL define `.gitignore` entries relevant to that technology. The generated output SHALL include a composite `.gitignore` section or file based on all selected technologies. |
| FR-403 | The system SHALL offer three delivery modes for boilerplate/template content, selectable by the user: |
|     | **(a) Download as zip** — The user downloads the generated file plus all template files as a zip archive, ready to unzip into a project directory. |
|     | **(b) Inline instructions** — Setup instructions for creating the boilerplate are embedded directly into the generated `AGENTS.md` / `CLAUDE.md` file, so the AI agent can execute them when it first reads the file. |
|     | **(c) Copy-paste prompt** — The system generates a single self-contained prompt that the user can paste into their AI agent. The prompt instructs the agent to create both the `AGENTS.md` and all boilerplate files, enabling full project initialization from a single copy-paste. |
| FR-404 | The system SHALL clearly distinguish between the generated file output and template files in the UI. |

### 3.5 Prompt Repository Management

| ID | Requirement |
|----|-------------|
| FR-500 | The prompt repository SHALL be stored as structured data (files, database, or both). |
| FR-501 | Each prompt fragment SHALL have metadata: technology, category, option dependencies, sort order, and version. |
| FR-502 | The system SHALL support adding new technologies, options, and prompt fragments without code changes (data-driven). |
| FR-503 | The system SHALL support versioning of prompt fragments so that updates don't silently change previously generated outputs. |
| FR-504 | Contributors SHALL be able to submit new prompt fragments or technologies through a defined contribution process. |
| FR-505 | The prompt repository SHALL be backed by a Git repository (e.g., on GitHub) so that all changes are tracked, reviewable, and reversible. |

### 3.6 Community Contribution (In-App Prompt Editing)

The prompt library is **completely open source** — it is just files in a public Git repository. There are no user accounts on the AgentsDotMD platform itself. The web UI provides a streamlined editing experience so that users can propose improvements without leaving the app, but the underlying mechanism is a standard GitHub pull request.

| ID | Requirement |
|----|-------------|
| FR-550 | The web UI SHALL display prompt fragments in an **editable** view during the preview step, allowing the user to modify fragment text inline. |
| FR-551 | When a user modifies a prompt fragment, the UI SHALL clearly distinguish between **local edits** (affecting only the user's current download) and a **contribution** (proposing the change back to the open-source prompt repository). |
| FR-552 | The user SHALL be able to submit their edits as a proposed change to the prompt repository via a "Suggest Change" action. |
| FR-553 | The system SHALL support two submission paths: |
|     | **(a) GitHub OAuth** — The user authenticates with GitHub, and the system opens a pull request on the prompt repository attributed to the user. The system does NOT fork the repo — it submits the PR directly. |
|     | **(b) Backend-mediated** — The user submits the change without any authentication. The backend collects the proposed edit and creates a PR on the prompt repository via a bot account, including the user's rationale in the PR description. |
| FR-554 | Each submission SHALL require the user to provide a brief description or rationale for the change. |
| FR-555 | The system SHALL show the diff between the original fragment and the user's proposed edit before submission. |
| FR-556 | The system SHALL support proposing **new** prompt fragments (not just edits to existing ones) — e.g., "This technology is missing guidance on X." |
| FR-557 | The system SHALL support proposing new options or new technologies through the same submission flow. |
| FR-558 | Submitted changes SHALL go through standard open-source PR review on the prompt repository before being merged into the live prompt library. |

### 3.7 GitHub Integration — Pull Request

| ID | Requirement |
|----|-------------|
| FR-600 | The system SHALL support authenticating with GitHub via OAuth. |
| FR-601 | An authenticated user SHALL be able to submit the generated file to a selected repository via **pull request** (not direct commit to the main branch). |
| FR-602 | The system SHALL allow the user to select the target repository. |
| FR-603 | The system SHALL allow the user to select the file path within the repository (default: root). |
| FR-604 | The system SHALL support creating a new repository with the generated file and boilerplate files. |
| FR-605 | The system SHALL support updating an existing file in a repository (detect and offer to overwrite or merge via PR). |

### 3.8 GitHub App (Marketplace)

The GitHub App is the primary in-GitHub integration. It is **user-initiated** — all generation begins with the user explicitly triggering the wizard from within their repository. There is no automatic webhook-based generation, because at repo creation time there is no content to infer a tech stack from and no config file to read.

| ID | Requirement |
|----|-------------|
| FR-650 | The system SHALL be published as a GitHub App available on the GitHub Marketplace. |
| FR-651 | The App SHALL add a user-accessible entry point within the GitHub UI for installed repositories (e.g., a button, menu item, or link in the repository's toolbar/settings). |
| FR-652 | When the user triggers the App, it SHALL open the AgentsDotMD wizard — either embedded in GitHub or as a redirect to the AgentsDotMD web UI with the target repository pre-selected. |
| FR-653 | The wizard SHALL present the full technology selection and option configuration flow (same as the standalone web UI). |
| FR-654 | After the user completes the wizard, the App SHALL deliver the generated `AGENTS.md` (and optional template files) via pull request so the user can review before merging. |
| FR-655 | The App SHALL support organization-wide installation, making it available across all repositories under that org. |
| FR-656 | The App SHALL support re-running — users can trigger the wizard again to regenerate or update their `AGENTS.md` at any time. |
| FR-657 | The App SHALL support a manual trigger via issue/PR comment command (e.g., `/generate-agent-md`) that opens or links to the wizard for that repository. |

### 3.9 Web Interface

| ID | Requirement |
|----|-------------|
| FR-800 | The system SHALL provide a web-based UI for all user-facing functionality. |
| FR-801 | The UI SHALL present a step-by-step workflow: select technologies -> configure options -> preview -> download/commit. |
| FR-802 | The UI SHALL provide search and filtering for the technology catalog. |
| FR-803 | The UI SHALL be responsive and functional on both desktop and mobile browsers. |
| FR-804 | The UI SHALL provide real-time preview of the generated output as options are toggled. |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-100 | File generation SHALL complete in under 2 seconds for any combination of selections. |
| NFR-101 | The technology catalog SHALL load in under 1 second. |

### 4.2 Scalability

| ID | Requirement |
|----|-------------|
| NFR-200 | The prompt repository SHALL support at least 100 technologies and 1,000 prompt fragments without architectural changes. |
| NFR-201 | The system SHALL support concurrent users without degradation. |

### 4.3 Extensibility

| ID | Requirement |
|----|-------------|
| NFR-300 | Adding a new technology SHALL require only data/content changes, not code changes. |
| NFR-301 | The prompt fragment schema SHALL be flexible enough to support future content types (e.g., code snippets, links, diagrams). |
| NFR-302 | The system architecture SHALL support future output formats beyond markdown (e.g., `.cursorrules`, IDE-specific config). |

### 4.4 Reliability

| ID | Requirement |
|----|-------------|
| NFR-400 | Core generation functionality SHALL remain available even if GitHub API integration is down. |
| NFR-401 | Generation SHALL work entirely client-side or with graceful degradation if the backend is unavailable. |

### 4.5 Security

| ID | Requirement |
|----|-------------|
| NFR-500 | GitHub OAuth tokens SHALL be used ephemerally for the current operation (commit or PR) and scoped to minimum required permissions. The system SHALL NOT persist tokens. |
| NFR-501 | The system SHALL not store any user data — it is fully stateless. |

---

## 5. User Flows

### 5.1 Basic Flow (Generate and Download)
1. User lands on the website.
2. User browses or searches the technology catalog.
3. User selects one or more technologies.
4. System presents relevant options for each selected technology (and any detected combinations).
5. User configures options (or accepts defaults).
6. System generates and displays a preview of the generated file.
7. User downloads the file (or zip with templates).

### 5.2 GitHub PR Flow
1. User follows the basic flow (steps 1-6 above).
2. User chooses "Send to GitHub" instead of download.
3. System prompts GitHub OAuth (one-time, ephemeral — no account created).
4. User selects target repository and file path.
5. System opens a pull request containing the generated file(s) on the target repository.
6. User reviews and merges the PR.

### 5.3 GitHub App Flow (User-Initiated from Repository)
1. User installs the AgentsDotMD GitHub App (from Marketplace) on their account or org.
2. User navigates to a repository where the App is installed.
3. User clicks the AgentsDotMD entry point (button/link) in the repository UI.
4. The App opens the AgentsDotMD wizard (embedded or via redirect to the web UI, with the repo pre-selected).
5. User walks through the wizard: selects technologies, configures options, previews the output.
6. User confirms generation.
7. The App creates a pull request containing the generated file (and optional template files).
8. User reviews and merges the PR.

### 5.4 Community Contribution Flow
1. User is viewing the generated `AGENTS.md` preview in the web UI.
2. User notices a prompt fragment that could be improved (inaccurate advice, missing nuance, outdated practice).
3. User clicks "Edit" on the fragment, making changes inline.
4. User clicks "Suggest Change" and provides a brief rationale.
5. User chooses a submission path:
   - **(a) With GitHub OAuth** — User authenticates, and the system opens a PR on the prompt repository attributed to the user.
   - **(b) Without authentication** — The backend creates a PR via a bot account, including the user's rationale.
6. Prompt repository maintainers review and merge (or request changes).

---

## 6. Future Considerations (Out of Scope for V1, Documented for Awareness)

- **AI-assisted customization**: Use an LLM to further tailor the generated output based on a natural language project description.
