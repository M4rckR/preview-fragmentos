# Repository Guidelines

## Project Structure & Module Organization

`previewFragment2.jssp` is the only deployed file. It contains Campaign server-side JavaScript/E4X, HTML, CSS, and client-side JavaScript. Pure conditional-content logic sits between `// BEGIN-PODA` and `// END-PODA`.

Read `CLAUDE.md` for environment constraints and `SIGUIENTE.md` for workflow context. `QA-CAMPAIGN.md` holds manual checks; `CHANGELOG.md` records historical changes. Some historical notes are outdated: verify them against current code and tooling. `design/handoff-legible.html` is the approved visual specification; other HTML files are reference artifacts. There are no separate source, asset, or test directories.

## Build, Test, and Development Commands

- `sh lint.sh`: run from the repository root before delivering changes. Checks encoding, Campaign delimiters, iframe isolation, network restrictions, and configuration; exits nonzero on failure.
- `git diff --check`: check patches for whitespace errors.

There is no build, package installation, or local Campaign runtime. Historical references to `npm run test:all` are not runnable in this checkout. For deployment, replace the code of Campaign's `cus:previewFragment` Dynamic JavaScript page with the complete JSSP file. Transfer the file intact to preserve backslashes and asterisks.

## Coding Style & Naming Conventions

Use ES5 JavaScript (`var`, `function`), two-space indentation, semicolons, and existing descriptive camelCase names. Retain uppercase configuration constants and CSS variables in `:root`. Do not add dependencies or external resources. There is no configured formatter.

Keep the JSSP ASCII-only: use HTML entities or JavaScript Unicode escapes for accents. Never introduce literal Campaign delimiters into client code, strings, or comments; construct them from separate pieces. Follow `CLAUDE.md` for permitted server interpolation.

## Testing Guidelines

No automated test framework or coverage threshold is configured. Lint does not replace runtime validation. Ask Marcos to execute `QA-CAMPAIGN.md` in Campaign, covering search, scenarios, preview sizing, exported HTML, keyboard navigation, and Workfront. Report checks performed and pending Campaign verification explicitly.

## Commit & Pull Request Guidelines

History favors short, action-oriented Spanish commit subjects, without mandatory prefixes. Keep changes focused. PR descriptions should explain behavior, validation results, and pending Campaign checks; include screenshots for visual changes when available and link relevant issues.

## Security & Agent Instructions

Keep `WORKFRONT_URL` empty in Git and sample data fictitious. Preserve `sandbox="allow-same-origin"` without script permission. Modify the server block only when requested. Keep the repository private until authentication and operator authorization are restored; preserve the commented login block.
