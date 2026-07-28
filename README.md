# CodeStats Readme

[![CI](https://github.com/vergissberlin/codestats-readme/actions/workflows/ci.yml/badge.svg)](https://github.com/vergissberlin/codestats-readme/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/vergissberlin/codestats-readme)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/vergissberlin/codestats-readme)](https://github.com/vergissberlin/codestats-readme/releases)

A GitHub Action that renders your [Code::Stats](https://codestats.net/) programming language
activity as an ASCII bar chart and commits it straight into your `README.md` — no server, no
external service, just a scheduled workflow.

```text
  JavaScript | ██████████████████████████████████████████ | 22377
         Vue | ████████████████████████████████████       | 19017
        YAML | ██████████████████████████████             | 16102
        HTML | ██████████████████████                     | 11666
    Markdown | █████████████████████                      | 10954
        SCSS | ████████████████████                       | 10888
```

## Quick Start

1. Add the marker comments to your `README.md` wherever you want the chart to appear:

   ```md
   <!--START_SECTION:codestats-->
   <!--END_SECTION:codestats-->
   ```

2. Add a workflow, e.g. `.github/workflows/codestats.yml`:

   ```yaml
   name: CodeStats – README

   on:
     workflow_dispatch:
     schedule:
       - cron: '0 0 * * *' # Daily at midnight UTC

   permissions:
     contents: write

   jobs:
     update-readme:
       name: Update this repo's README
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v7

         - uses: vergissberlin/codestats-readme@v1
           with:
             CODESTATS_USERNAME: <your-codestats-username>
   ```

3. Run the workflow once (`workflow_dispatch`) or wait for the schedule — the action fetches
   your CodeStats data, renders the chart, and commits the updated README back to the repo.

> The `contents: write` permission (and the default `GITHUB_TOKEN` input) is all the action
> needs to push the update — no extra secrets or personal access tokens required.

## Inputs

| Input                | Required | Default                                        | Description                                                        |
| -------------------- | -------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| `CODESTATS_USERNAME` | Yes      | -                                              | Your [Code::Stats](https://codestats.net/) username                |
| `GITHUB_USERNAME`    | No       | `${{ github.repository_owner }}`               | Identity to attribute the commit to                                |
| `GITHUB_TOKEN`       | No       | `${{ github.token }}`                          | Token used to push the updated README (needs `contents: write`)    |
| `COMMIT_MESSAGE`     | No       | `Update the graph with new CodeStats metrics.` | Commit message for the update                                      |
| `README_FILE`        | No       | `./README.md`                                  | Path to the README file to update                                  |
| `SHOW_TITLE`         | No       | `false`                                        | Show a title with the last-update timestamp above the chart        |
| `SHOW_LINK`          | No       | `false`                                        | Show a link to your CodeStats profile below the chart              |
| `GRAPH_WIDTH`        | No       | `42`                                           | Width (in characters) of the rendered bars                         |
| `DEBUG`              | No       | -                                              | Enable verbose logging of environment variables and git operations |

> `SHOW_TITLE` and `SHOW_LINK` are read as the exact string `"true"` — set them with
> `SHOW_TITLE: 'true'` in your workflow YAML.

## Example with all options

```yaml
- uses: vergissberlin/codestats-readme@v1
  with:
    CODESTATS_USERNAME: vergissberlin
    COMMIT_MESSAGE: 'chore: update CodeStats graph'
    SHOW_TITLE: 'true'
    SHOW_LINK: 'true'
    GRAPH_WIDTH: '60'
    README_FILE: './README.md'
```

## How It Works

1. **Fetch** — the action calls the public CodeStats API at
   `https://codestats.net/api/users/<username>`.
2. **Render** — the top 6 languages by experience points (XP) are turned into an ASCII bar
   chart.
3. **Replace** — everything between `<!--START_SECTION:codestats-->` and
   `<!--END_SECTION:codestats-->` in your README is replaced with the new chart.
4. **Commit & push** — the change is committed (author set from `GITHUB_USERNAME`) and pushed
   back to the branch the workflow is running on.

The action runs as a Docker container (see [`Dockerfile`](Dockerfile)) with no dependency on
your repository's Node.js setup.

## Contributing

Bug reports, feature requests and pull requests are welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md) for local development, testing, and release details.

## License

[MIT](LICENSE) © [André Lademann](https://github.com/vergissberlin)
