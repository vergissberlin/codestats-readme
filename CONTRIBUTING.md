# Contributing to CodeStats README

Thank you for your interest in contributing! This document provides all the technical information needed to develop, test, and contribute to this project.

## 🛠️ Development Setup

### Prerequisites

- Node.js 24 or later
- pnpm package manager (version pinned in `package.json#packageManager`, use `corepack enable`)
- Git
- Docker (optional, for container testing — this is how the action actually runs in production)

### Getting Started

1. **Fork and clone the repository**:

   ```bash
   git clone https://github.com/your-username/codestats-readme.git
   cd codestats-readme
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Run tests to ensure everything works**:

   ```bash
   pnpm test
   ```

## 📁 Project Structure

```
├── src/
│   ├── index.ts                   # Main application logic
│   ├── lib/chart.ts                # Vendored ASCII chart renderer
│   └── types/index.ts              # Shared TypeScript types
├── action.yml                      # GitHub Action metadata (Docker-based)
├── Dockerfile                      # Container definition used by the action
├── package.json                    # Dependencies and scripts
├── tests/                          # Vitest test suite
│   ├── api-validation.test.js      # API/env-var validation and regression tests
│   ├── index.test.js               # buildChart / replaceCodestatsSection tests
│   ├── chart.test.js               # Chart renderer tests
│   ├── git-operations.test.js      # makeUpdateReadme / makeCommitChanges tests
│   ├── build-chart-error-handling.test.js
│   ├── mocks/                      # Mock data for tests
│   └── fixtures/                   # Sample README used for local runs
├── WARP.md                         # Development context for Warp
├── README.md                       # User-facing (Marketplace) documentation
└── CONTRIBUTING.md                 # This file
```

## 🧪 Testing

The project has broad test coverage (90%+ statements/lines, see `pnpm run coverage`) across
several test types:

### Run All Tests

```bash
pnpm test
```

### Run Tests with Coverage

```bash
pnpm coverage
```

### Test Types

1. **Unit Tests** (`tests/index.test.js`)
   - Test individual functions like `buildChart` and `replaceCodestatsSection`
   - Validate data processing logic

2. **API Validation Tests** (`tests/api-validation.test.js`)
   - Test CodeStats API integration
   - Validate response structure and error handling
   - Test edge cases and malformed data

3. **Chart Renderer Tests** (`tests/chart.test.js`)
   - Alignment, scaling, and edge cases of the vendored ASCII histogram

4. **Git Operations Tests** (`tests/git-operations.test.js`)
   - `makeUpdateReadme` with `fs` mocked (read/write/error paths)
   - `makeCommitChanges` with `simple-git` mocked (commit author format,
     authenticated remote push, error handling)

5. **Mock Data** (`tests/mocks/codestats-api.mock.js`)
   - Realistic API response scenarios
   - Error conditions (404, 500, network errors)
   - Various user types (beginner, expert, empty)

### Testing with Real Data

For manual testing with your CodeStats account:

```bash
# Runs src/index.ts directly via tsx, no build step needed
INPUT_CODESTATS_USERNAME=your-username \
INPUT_README_FILE=./tests/fixtures/README.md \
INPUT_SHOW_TITLE=true \
INPUT_SHOW_LINK=true \
pnpm run dev
```

### Docker Testing

The action always runs as a Docker container in production (see `action.yml`), so this is the
most faithful way to test it locally. GitHub Actions mounts the checkout at
`/github/workspace` and runs the container with that as its working directory — mirror that
here so relative paths (like the default `./README.md`) resolve the same way:

```bash
docker build -t codestats-readme .

docker run --rm \
  -e INPUT_CODESTATS_USERNAME=your-username \
  -e INPUT_README_FILE=./README.md \
  -e INPUT_SHOW_TITLE=true \
  -e INPUT_SHOW_LINK=true \
  -v "$PWD":/github/workspace \
  -w /github/workspace \
  codestats-readme
```

## 🏗️ Architecture

### Core Components

1. **`createOptions()`** - Parses environment variables and creates configuration
2. **`start()`** - Main entry point, fetches API data and orchestrates the update
3. **`buildChart(data, width)`** - Generates ASCII bar charts from language data
4. **`replaceCodestatsSection(markdown, content, header, footer)`** - Updates README content
5. **`makeUpdateReadme(opts)`** - Handles file operations
6. **`makeCommitChanges(opts)`** - Commits changes to git, authenticating the remote with the
   `GITHUB_TOKEN` input when one is configured
7. **`renderBarChart(data, opts)`** (`src/lib/chart.ts`) - Vendored ASCII histogram renderer

### Data Flow

1. Environment variables → `createOptions()` → Configuration object
2. Configuration → `start()` → API request to CodeStats
3. API response → `buildChart()` → ASCII chart
4. Chart + README → `replaceCodestatsSection()` → Updated content
5. Updated content → File system → Git commit

### Error Handling

The application includes robust error handling for:

- Invalid API responses
- Malformed JSON
- Missing or invalid language data
- File system errors
- Network timeouts

## 🔧 Configuration

### Environment Variables

All inputs are prefixed with `INPUT_` in the action environment:

| Variable                   | Description            | Default                    | Validation                      |
| -------------------------- | ---------------------- | -------------------------- | ------------------------------- |
| `INPUT_CODESTATS_USERNAME` | CodeStats username     | -                          | Required, string                |
| `INPUT_GITHUB_USERNAME`    | Commit author identity | `github.repository_owner`  | Optional, string                |
| `INPUT_GITHUB_TOKEN`       | Push authentication    | `github.token`             | Optional, string                |
| `INPUT_README_FILE`        | README file path       | `./README.md`              | Optional, string                |
| `INPUT_SHOW_TITLE`         | Show timestamp header  | `false`                    | Optional, exact string `"true"` |
| `INPUT_SHOW_LINK`          | Show profile link      | `false`                    | Optional, exact string `"true"` |
| `INPUT_GRAPH_WIDTH`        | Chart width            | `42`                       | Optional, number                |
| `INPUT_COMMIT_MESSAGE`     | Git commit message     | `Update codestats metrics` | Optional, string                |

Boolean inputs are compared against the literal string `"true"`, not cast with `Boolean(...)` —
GitHub Actions always passes inputs as strings, so `Boolean("false")` would otherwise evaluate
to `true`.

### API Integration

The action uses the CodeStats API endpoint:

```
https://codestats.net/api/users/{username}
```

Expected response structure:

```javascript
{
  "user": "username",
  "languages": {
    "JavaScript": { "xps": 188377, "new_xps": 0 },
    // ... more languages
  },
  "dates": { "2024-01-01": 1234 },
  "machines": { "machine": { "xps": 12345 } },
  "total_xp": 123456,
  "new_xp": 15
}
```

## 🚀 Release Process

Releases are automated with [Release Please](https://github.com/googleapis/release-please)
(`.github/workflows/release-please.yml`):

1. Merge Conventional Commits into `main` (`feat:`, `fix:`, …)
2. Release Please opens/updates a release PR with the version bump and changelog
3. Merging that PR creates the GitHub release and tag
4. A follow-up job builds and pushes the Docker image to Docker Hub
   (`vergissberlin/codestats-readme`), tagged with the new semver

Do not bump `package.json#version` or create tags manually — Release Please owns that.

### Branch Strategy

- `main` - Production-ready code
- Feature branches - `feature/description`
- Hotfix branches - `hotfix/description`

## 🐛 Debugging

### Enable Debug Mode

Set `INPUT_DEBUG=true` to enable verbose logging:

```bash
INPUT_DEBUG=true INPUT_CODESTATS_USERNAME=username pnpm run dev
```

### Common Issues

1. **API Rate Limits**: CodeStats may have rate limits
2. **Private Profiles**: Ensure your CodeStats profile is public
3. **Invalid Username**: Verify username exists on CodeStats
4. **README Markers**: Ensure `<!-- START_SECTION:codestats -->` and `<!-- END_SECTION:codestats -->` exist

### Log Analysis

The application logs:

- Environment variables (in debug mode)
- API request/response details
- File operation results
- Git command execution
- Error details with stack traces

## 📝 Code Style

### Conventions

- 2-space indentation (enforced by Prettier, no tabs)
- Semicolons required
- Single quotes for strings
- Descriptive variable names
- Comments explain _why_, not _what_ — skip them where the code is self-explanatory

### Linting

Code style is enforced through:

- ESLint configuration
- Prettier formatting
- Vitest for testing
- GitHub Actions for CI

### Commit Messages

Follow conventional commits:

```
feat(api): add new CodeStats endpoint support
fix(chart): handle zero XP values correctly
test(integration): add end-to-end workflow tests
docs(readme): update configuration examples
```

## 🤝 Contributing Guidelines

### Before Contributing

1. Check existing issues and discussions
2. Create an issue for new features
3. Fork the repository
4. Create a feature branch

### Pull Request Process

1. **Code Quality**:
   - All tests must pass
   - Maintain 100% test coverage
   - Follow code style guidelines

2. **Documentation**:
   - Update README.md for user-facing changes
   - Update this CONTRIBUTING.md for developer changes
   - Add JSDoc comments for new functions

3. **Testing**:
   - Add tests for new features
   - Update existing tests if needed
   - Ensure edge cases are covered

4. **Review Process**:
   - PRs require review and approval
   - Address all review feedback
   - Keep PR scope focused and small

### Types of Contributions

- 🐛 **Bug fixes** - Always welcome
- ✨ **New features** - Discuss in issues first
- 📚 **Documentation** - Improvements always appreciated
- 🧪 **Tests** - Additional test coverage helpful
- 🔧 **Refactoring** - Code improvements welcome

## 🆘 Getting Help

- 📫 **Issues**: Create a GitHub issue for bugs or feature requests
- 💬 **Discussions**: Use GitHub Discussions for questions
- 📧 **Contact**: Reach out to maintainers directly for sensitive issues

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CodeStats README! 🎉
