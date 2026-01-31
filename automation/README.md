# AgentsDotMD Screenshot Automation

Playwright script that navigates through each page of the app and captures desktop and mobile screenshots of key interactions.

## Setup

```bash
cd automation
npm install
npm run install-browsers
```

## Usage

Start the dev server first (from the project root):

```bash
npx wrangler dev
```

Then run the screenshot script:

```bash
npm run screenshot
```

You can also pass a custom base URL:

```bash
node screenshotter.js http://localhost:8788
```

## Output

Screenshots are saved to `automation/screenshots/` with descriptive, hardcoded filenames. Each run overwrites previous screenshots. Both desktop (1280x800) and mobile (390x844) viewports are captured.

The `screenshots/` directory is gitignored.
