# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project

- **Name:** capable (iOS/Android fitness app)
- **Framework:** Expo (React Native) with expo-router
- **Styling:** NativeWind (Tailwind)
- **Language:** TypeScript
- **Package manager:** npm

## Branch Workflow

Work on a feature branch, never directly on `main`. Merge to `main` only when work is ready, via a PR on GitHub.

- Current working branch: `claude/setup-pc-dev-environment-lgwDu`
- All commits go to the feature branch.
- Before starting each session, pull the latest: `git pull origin <branch-name>`.
- If `main` moves ahead during the work, periodically merge or rebase `main` into the feature branch to avoid a big merge conflict at the end.
- When done, open a PR from the feature branch into `main` on GitHub and merge.

## Dev Commands

- `npm install` - install dependencies
- `npm start` - Expo dev server (QR code for Expo Go)
- `npm run web` - run in browser
- `npm run android` - run on Android emulator / device
- `npm run ios` - run on iOS Simulator (macOS only)
- `Ctrl+C` in the dev-server terminal to stop it

## Common Gotchas

- If `git pull` errors with *"untracked working tree files would be overwritten by merge"* for `.gitignore` or `package-lock.json`, delete the local copies (PowerShell: `del .gitignore, package-lock.json`) and retry the pull.
- `npm run ios` requires macOS. Use `npm run android` or `npm run web` on Windows/Linux.
- Re-run `npm install` after pulling if dependencies changed.
