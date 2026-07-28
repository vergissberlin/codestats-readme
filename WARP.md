# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**codestats-readme** is a GitHub Action that integrates [CodeStats](https://codestats.net/)
programming language metrics into README files. The action fetches coding activity data from the
CodeStats API and generates an ASCII bar chart that is automatically committed into README.md
between special comment markers.

## Architecture

- **Language**: TypeScript, compiled with `tsc` to `dist/` (gitignored, build artifact only)
- **Runtime**: Node.js 24, executed inside the project's own Docker image
- **Package Manager**: pnpm (version pinned via `package.json#packageManager`)
- **Action Type**: Docker container action (`action.yml` → `runs.using: docker`, `image: Dockerfile`)

### Core Components

- **`src/index.ts`**: Main implementation
  - `createOptions()` — reads and validates `INPUT_*`/`GITHUB_*` env vars into `AppOptions`
  - `start()` — fetches the CodeStats API and drives the update
  - `buildChart()` — filters/sorts language XP data and renders the chart
  - `replaceCodestatsSection()` — regex-based replacement between the README markers
  - `makeUpdateReadme()` — reads, updates and writes the README file
  - `makeCommitChanges()` — commits and pushes via `simple-git`, authenticating the
    remote with the `GITHUB_TOKEN` input when set
- **`src/lib/chart.ts`**: Vendored ASCII histogram renderer (`key | bar | value`),
  ported from jstrace/bars (MIT) instead of depending on it — that package was
  never published to npm and is only installable from a GitHub tarball, which
  is a supply-chain and reliability risk (fails outright under restrictive
  network policies).
- **`src/types/index.ts`**: Shared TypeScript interfaces/types
- **`action.yml`**: Action metadata, inputs, and the `runs.using: docker` entrypoint
- **`Dockerfile`**: Multi-stage build (compiles TypeScript, then a minimal
  non-root runtime image); `ENTRYPOINT` uses an absolute path because GitHub
  Actions overrides a docker-container action's working directory to
  `/github/workspace`
- **`tests/`**: Vitest test suite (`*.test.js`) plus `tests/mocks/` fixtures

### Data Flow

1. **Input**: CodeStats username and configuration options (`action.yml` inputs)
2. **API Call**: Fetch language experience data from the CodeStats API
3. **Chart Generation**: Convert language XP data into an ASCII bar chart
4. **File Modification**: Replace content between `<!-- START_SECTION:codestats -->` and
   `<!-- END_SECTION:codestats -->` markers
5. **Git Commit**: Commit and push the updated README

## Development Commands

```bash
# Install dependencies
pnpm install

# Run the test suite
pnpm test
pnpm run coverage

# Lint and format
pnpm run lint       # ESLint (TS) + markdownlint
pnpm run format:check

# Build (tsc -> dist/)
pnpm run build

# Run locally against a fixture README
INPUT_CODESTATS_USERNAME=vergissberlin \
INPUT_README_FILE=./tests/fixtures/README.md \
INPUT_SHOW_TITLE=true \
INPUT_SHOW_LINK=true \
pnpm run dev
```

**Docker approach** (mirrors how the action actually runs in production):

```bash
docker build -t codestats-readme .

docker run --rm \
  -e INPUT_CODESTATS_USERNAME=vergissberlin \
  -e INPUT_README_FILE=/github/workspace/README.md \
  -e INPUT_SHOW_TITLE=true \
  -e INPUT_SHOW_LINK=true \
  -v "$PWD":/github/workspace \
  -w /github/workspace \
  codestats-readme
```

### Testing

All tests live under `tests/` and run via Vitest:

- `tests/index.test.js` — `buildChart` / `replaceCodestatsSection` unit tests
- `tests/api-validation.test.js` — API response handling, `createOptions` env-var parsing,
  error-path regression tests
- `tests/chart.test.js` — the vendored ASCII chart renderer
- `tests/git-operations.test.js` — `makeUpdateReadme` (fs) and `makeCommitChanges`
  (`simple-git`) with `fs`/`simple-git` mocked
- `tests/build-chart-error-handling.test.js` — the chart-rendering failure fallback
- `tests/mocks/codestats-api.mock.js` — realistic CodeStats API response fixtures

## Configuration

### Action Inputs (action.yml)

| Input                | Required | Default                                          | Description                                      |
| -------------------- | -------- | ------------------------------------------------ | ------------------------------------------------ |
| `CODESTATS_USERNAME` | Yes      | -                                                | CodeStats username                               |
| `GITHUB_USERNAME`    | No       | `${{ github.repository_owner }}`                 | Git identity for the commit author               |
| `GITHUB_TOKEN`       | No       | `${{ github.token }}`                            | Token used to authenticate the push              |
| `COMMIT_MESSAGE`     | No       | `'Update the graph with new CodeStats metrics.'` | Commit message                                   |
| `SHOW_TITLE`         | No       | `false`                                          | Show title with date (string `"true"`/`"false"`) |
| `SHOW_LINK`          | No       | `false`                                          | Show link to CodeStats profile                   |
| `GRAPH_WIDTH`        | No       | `42`                                             | Width of the generated chart                     |
| `DEBUG`              | No       | -                                                | Enable debug logging                             |

Boolean inputs are compared against the literal string `"true"` — GitHub Actions passes every
input as a string, so `Boolean(env.INPUT_X)` would incorrectly treat `"false"` as truthy.

### README Integration

Add these markers to your README.md where you want the stats to appear:

```md
<!--START_SECTION:codestats-->
<!--END_SECTION:codestats-->
```

## Dependencies

### Production Dependencies

- `simple-git` — git operations (commit, authenticated push)

### Development Dependencies

- `vitest` / `@vitest/coverage-v8` — test runner and coverage
- `typescript`, `tsx` — build and local dev execution
- `eslint`, `markdownlint-cli2`, `prettier` — linting/formatting
- `husky`, `lint-staged`, `commitlint`, `commitizen` — commit hooks and Conventional Commits

## CI/CD

- **`.github/workflows/ci.yml`** — tests, coverage, lint, build, `actionlint`, and a Docker
  build/smoke-test on every push/PR to `main`/`develop`
- **`.github/workflows/release-please.yml`** — Release Please manages versioning/changelog
  on `main`; on release it builds and pushes the Docker image to Docker Hub
  (`vergissberlin/codestats-readme`)

## Troubleshooting

### Debug Mode

Set `INPUT_DEBUG=true` to enable verbose logging of environment variables and git status.

### Common Issues

- **API Failures**: Ensure the CodeStats username exists and the profile is public
- **Git Push Issues**: Verify the token input has `contents: write` permission on the repo
- **Regex Replacement**: Ensure the README contains the exact comment markers

## Rules Compliance

Per your rules:

- All documentation is in English and Markdown format
- Use ellipsis character (…) instead of three dots
- Follow Conventional Commits specification for any changes
- For process diagrams, use drawio as the preferred tool
- When referencing dates like 2021-05-12T14:48:04Z, format as 12. Mai 2021
