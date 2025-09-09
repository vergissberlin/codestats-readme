# CodeStats README

> 📊 A GitHub Action that automatically updates your README with your [CodeStats](https://codestats.net/) programming statistics

Show off your coding activity with beautiful ASCII bar charts directly in your profile README!

<!-- START_SECTION:codestats -->
```text
    Markdown | ██████████████████████████████████████████ | 220306
  JavaScript | ████████████████████████████████████       | 188377
         Vue | ███████████████████████████                | 143143
        HTML | ██████████████████████████                 | 137284
          Go | ████████████████                           | 82348
        YAML | ██████████████                             | 73315
```
<!-- END_SECTION:codestats -->

## 🚀 Quick Start

### Prerequisites

1. A [CodeStats](https://codestats.net/) account with a **public profile**
2. The special markers in your README (see step 2)

### Setup

1. **Add the markers** to your README.md where you want the stats to appear:

   ```md
   <!-- START_SECTION:codestats -->
   <!-- END_SECTION:codestats -->
   ```

2. **Create a workflow** in `.github/workflows/codestats.yml`:

   ```yml
   name: Update CodeStats

   on:
     schedule:
       - cron: '0 0 * * *' # Daily at midnight
     workflow_dispatch: # Manual trigger

   jobs:
     update-readme:
       runs-on: ubuntu-latest
       permissions:
         contents: write
       steps:
         - uses: vergissberlin/codestats-readme@v0.1.0
           with:
             CODESTATS_USERNAME: your-codestats-username
   ```

3. **Customize** (optional) - see [Configuration](#-configuration) below

4. **Run** the workflow manually or wait for the next scheduled run

## ⚙️ Configuration

All configuration is done through workflow inputs:

| Input | Description | Default | Required |
|-------|-------------|---------|----------|
| `CODESTATS_USERNAME` | Your CodeStats username | - | ✅ |
| `README_FILE` | Path to README file | `./README.md` | ❌ |
| `SHOW_TITLE` | Show update timestamp | `false` | ❌ |
| `SHOW_LINK` | Show link to your profile | `false` | ❌ |
| `GRAPH_WIDTH` | Width of the ASCII bars | `42` | ❌ |
| `COMMIT_MESSAGE` | Custom commit message | `Update codestats metrics` | ❌ |

### Example with all options:

```yml
- uses: vergissberlin/codestats-readme@v0.1.0
  with:
    CODESTATS_USERNAME: your-username
    README_FILE: ./profile/README.md
    SHOW_TITLE: true
    SHOW_LINK: true
    GRAPH_WIDTH: 50
    COMMIT_MESSAGE: "📊 Updated coding stats"
```

## ✨ Features

- 📊 **Beautiful ASCII Charts** - Clean, visual representation of your coding activity
- 🎯 **Top 6 Languages** - Shows your most used programming languages
- 🔄 **Auto-sorted** - Languages sorted by experience points (XPs)
- ⚡ **Fast & Reliable** - Built with Node.js 20 and comprehensive tests
- 🐳 **Docker Support** - Available as container image
- 🔧 **Customizable** - Multiple configuration options

## 🐳 Docker Usage

Run as a standalone container:

```bash
docker run --rm -v "$PWD:/workspace" -w /workspace \
  -e CODESTATS_USERNAME=your_username \
  -e GITHUB_TOKEN=your_token \
  ghcr.io/vergissberlin/codestats-readme:latest
```

## 🤝 Contributing

Want to contribute? Check out [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing, and contribution guidelines.

## 📄 License

MIT © [André Lademann](https://github.com/vergissberlin)

## 🙋‍♀️ Support

- 📫 **Issues**: [GitHub Issues](https://github.com/vergissberlin/codestats-readme/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/vergissberlin/codestats-readme/discussions)
- ⭐ **Star this repo** if you find it useful!

---

<div align="center">
  <sub>Built with ❤️ for the developer community</sub>
</div>
