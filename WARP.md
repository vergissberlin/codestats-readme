# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**codestats-readme** is a GitHub Action that integrates [CodeStats](https://codestats.net/) programming language metrics into README files. The action fetches coding activity data from the CodeStats API and generates visual charts that are automatically inserted into README.md files between special comment markers.

## Architecture

This is a **Node.js GitHub Action** with a simple, focused architecture:

- **Runtime**: Node 12 (as specified in `action.yml`)
- **Package Manager**: Yarn (lockfile present)
- **Entry Point**: `index.js` - single-file implementation
- **Action Type**: JavaScript action (`runs.using: 'node12'`)

### Core Components

- **`index.js`**: Main implementation containing:
  - CodeStats API integration (`request` library)
  - Chart generation using the `bars` library
  - README file manipulation with regex-based replacement
  - Git operations via `simple-git` for committing changes
- **`action.yml`**: Action metadata and input/output definitions
- **`tests/`**: Contains exploratory test files for individual components
- **`Dockerfile`**: Container-based execution environment

### Data Flow

1. **Input**: CodeStats username and configuration options
2. **API Call**: Fetch language experience data from CodeStats API
3. **Chart Generation**: Convert language XP data into ASCII bar charts
4. **File Modification**: Replace content between `<!-- START_SECTION:codestats -->` and `<!-- END_SECTION:codestats -->` markers
5. **Git Commit**: Auto-commit changes to the README

## Development Commands

### Local Development

**Node.js approach**:

```bash
# Install dependencies
yarn install

# Run locally with environment variables
INPUT_CODESTATS_USERNAME=vergissberlin \
INPUT_README_FILE=./tests/fixtures/README.md \
INPUT_SHOW_TITLE=true \
INPUT_SHOW_LINK=true \
node index.js
```

**Docker approach**:

```bash
# Build Docker image
docker build -t vergissberlin/codestats-readme .

# Run with Docker
docker run \
  -e INPUT_CODESTATS_USERNAME=vergissberlin \
  -e INPUT_README_FILE=/data/README.md \
  -e INPUT_SHOW_TITLE=true \
  -e INPUT_SHOW_LINK=true \
  -e INPUT_DEBUG=true \
  -v $PWD/tests/fixtures/README.md:/data/README.md \
  -v $PWD:/app \
  vergissberlin/codestats-readme
```

### Testing

The project uses exploratory test files rather than a formal test runner:

- `tests/bar.js` - Tests the `bars` chart generation library
- `tests/git.js` - Tests Git operations with `simple-git`
- `tests/replace.js` - Tests README content replacement logic
- `tests/fixtures/README.md` - Sample README for testing

Run individual test components:

```bash
node tests/bar.js
node tests/git.js
node tests/replace.js
```

## Configuration

### Action Inputs (action.yml)

| Input                | Required | Default                                          | Description                    |
| -------------------- | -------- | ------------------------------------------------ | ------------------------------ |
| `CODESTATS_USERNAME` | Yes      | -                                                | CodeStats username             |
| `GITHUB_USERNAME`    | No       | `${{ github.repository_owner }}`                 | GitHub username                |
| `GITHUB_TOKEN`       | No       | `${{ github.token }}`                            | GitHub token                   |
| `COMMIT_MESSAGE`     | No       | `'Update the graph with new CodeStats metrics.'` | Commit message                 |
| `SHOW_TITLE`         | No       | `false`                                          | Show title with date           |
| `SHOW_LINK`          | No       | `false`                                          | Show link to CodeStats profile |
| `GRAPH_WIDTH`        | No       | `42`                                             | Width of the generated chart   |
| `DEBUG`              | No       | `false`                                          | Enable debug logging           |

### Usage in Workflows

```yml
name: CodeStats – README

on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight UTC

jobs:
  update-readme:
    name: Update this repo's README
    runs-on: ubuntu-latest
    steps:
      - uses: vergissberlin/codestats-readme@main
        with:
          CODESTATS_USERNAME: <username>
```

### README Integration

Add these markers to your README.md where you want the stats to appear:

```md
<!--START_SECTION:codestats-->
<!--END_SECTION:codestats-->
```

## Dependencies

### Production Dependencies

- `bars` (jstrace/bars) - ASCII chart generation
- `child_process` - Process execution utilities
- `request` - HTTP client for CodeStats API
- `simple-git` - Git operations

### Development Dependencies

- `nock` - HTTP mocking for tests

## CI/CD

The project includes GitHub Actions workflow for Docker publishing (`/.github/workflows/docker-publish.yml`):

- Builds and tests on push to master and PR events
- Publishes Docker images to GitHub Packages
- Uses Node 12 runtime environment

## Troubleshooting

### Debug Mode

Set `INPUT_DEBUG=true` to enable verbose logging of environment variables and Git operations.

### Common Issues

- **API Failures**: Ensure CodeStats username exists and profile is public
- **Git Commit Issues**: Verify GitHub token has appropriate repository permissions
- **Regex Replacement**: Ensure README contains the exact comment markers format

## Rules Compliance

Per your rules:

- All documentation is in English and Markdown format
- Use ellipsis character (…) instead of three dots
- Follow Conventional Commits specification for any changes
- For process diagrams, use drawio as the preferred tool
- When referencing dates like 2021-05-12T14:48:04Z, format as 12. Mai 2021
