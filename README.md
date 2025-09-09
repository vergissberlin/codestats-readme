# Dev Metrics in Readme

[CodeStats](https://codestats.net/) Weekly Metrics on your Profile Readme:

## Prep work

1. You need to update the markdown file(.md) with 2 comments. You can refer [here](#update-your-readme) for updating it.
2. You'll need a [CodeStats](https://codestats.net/) account.
3. Your profile has to be public. (Settings)

## Update your README.md

Add a comment to your `README.md` like this:

```md
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
   ```

4. Go to Workflows menu (mentioned in step 1), click `CodeStats Readme`, click `Run workflow`.
5. Go to your profile page. you will be able to see it.

## Why only the language stats and not other data from the API?

I am a fan of minimal designs and the profile readme is a great way to show off your skills and interests. The CodeStats API, gets us a **lot of data** about a person's **coding activity**. Using up more data via the CodeStats API will clutter the profile readme and hinder your chances on displaying what you provide **value to the community** like the pinned Repositories. You are _**exercising these languages or learning a new language**_, this will also show that you spend some amount of time to learn and exercise your development skills. That's what matters in the end :heart:

## Usage as Docker Image

The action is also available as a Docker image, which can be used in any CI/CD system:

```bash
# Using GitHub Container Registry (recommended)
docker run --rm -v "$PWD:/workspace" -w /workspace \
  -e CODESTATS_USERNAME=your_username \
  -e GITHUB_TOKEN=your_token \
  ghcr.io/vergissberlin/codestats-readme:latest
```

> **Note**: The Docker image is automatically built and pushed to [GitHub Container Registry](https://github.com/vergissberlin/codestats-readme/pkgs/container/codestats-readme) on every release.

## Testing

### Docker (Local Development)

```bash
docker build -t vergissberlin/codestats-readme .
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

### node

```bash
INPUT_CODESTATS_USERNAME=vergissberlin \
INPUT_README_FILE=./tests/fixtures/README.md \
INPUT_SHOW_TITLE=true \
INPUT_SHOW_LINK=true \
node index.js
```
