import * as fs from 'fs';
import simpleGit from 'simple-git';
import type {
  AppOptions,
  EnvironmentVariables,
  LanguageChart,
  RequestCallback,
  UpdateReadmeFunction,
  CommitChangesFunction,
  BarsOptions,
  CodeStatsApiResponse,
} from './types/index.js';

// Import bars module (no types available)
const bars = require('bars') as (data: Record<string, number>, options: BarsOptions) => string;

/**
 * Debug logging
 */
if (typeof process.env.INPUT_DEBUG !== 'undefined') {
  console.log(process.env);
}

/**
 * Create options from environment variables
 */
export function createOptions(): AppOptions {
  const env = process.env as EnvironmentVariables;
  
  // Validate environment variables
  if (typeof env.INPUT_CODESTATS_USERNAME === 'undefined') {
    throw new Error('InvalidArgumentException – The CODESTATS_USERNAME has to be set!');
  }

  return {
    codestats: {
      username: env.INPUT_CODESTATS_USERNAME,
      url: `https://codestats.net/api/users/${env.INPUT_CODESTATS_USERNAME}`,
      profile: `https://codestats.net/users/${env.INPUT_CODESTATS_USERNAME}`,
    },
    git: {
      username: env.GITHUB_ACTOR ?? 'CodeStats bot',
      message: env.INPUT_COMMIT_MESSAGE ?? 'Update codestats metrics',
      token: env.INPUT_GITHUB_TOKEN ?? '',
    },
    graph: {
      width: Number(env.INPUT_GRAPH_WIDTH) || 42,
    },
    readmeFile: env.INPUT_README_FILE ?? './README.md',
    show: {
      title: Boolean(env.INPUT_SHOW_TITLE) || false,
      link: Boolean(env.INPUT_SHOW_LINK) || false,
    },
  };
}

/**
 * Create request callback
 */
export function makeCallback(opts: AppOptions): RequestCallback {
  return function (error, response, body): void {
    if (!error && response?.statusCode === 200 && body) {
      try {
        const apiResponse = JSON.parse(body) as CodeStatsApiResponse;
        const languages = Object.entries(apiResponse.languages);
        const updateReadmeForOpts = makeUpdateReadme(opts);
        const commitChangesForOpts = makeCommitChanges(opts);
        updateReadmeForOpts(buildChart(languages, opts.graph.width), commitChangesForOpts);
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
      }
    } else if (error) {
      console.error('API request failed:', error.message);
    } else {
      console.error(`API request failed with status: ${response?.statusCode || 'unknown'}`);
    }
  };
}

/**
 * Create commit changes function
 */
export function makeCommitChanges(opts: AppOptions): CommitChangesFunction {
  return function (): void {
    const git = simpleGit();
    if (typeof process.env.INPUT_DEBUG !== 'undefined') {
      console.log('::: Commit changes');
      git.status().catch((err) => console.error('Git status error:', err));
    }
    
    git
      .commit(opts.git.message, opts.readmeFile, { '--author': opts.git.username })
      .then(() => git.push())
      .catch((err) => console.error('Git operations failed:', err));
  };
}

/**
 * Build chart with data
 */
export function buildChart(data: Array<[string, any]>, width: number = 42): string {
  let languageChart: LanguageChart = {};

  // Filter out invalid entries and ensure numeric xps values
  const validData = data.filter(([key, value]) => {
    return (
      key &&
      value &&
      typeof value === 'object' &&
      typeof value.xps === 'number' &&
      value.xps >= 0 &&
      isFinite(value.xps)
    );
  });

  // Return empty string if no valid data
  if (validData.length === 0) {
    return '';
  }

  validData.sort((a, b) => b[1].xps - a[1].xps);
  const topLanguages = validData.slice(0, 6);
  
  topLanguages.forEach(([key, value]) => {
    languageChart[key] = value.xps;
  });

  // Handle empty chart case
  if (Object.keys(languageChart).length === 0) {
    return '';
  }

  try {
    const barsOptions: BarsOptions = { bar: '█', width };
    return bars(languageChart, barsOptions);
  } catch (error) {
    // If bars library fails, return empty string
    console.error('Chart generation failed:', error);
    return '';
  }
}

/**
 * Replace the codestats section in markdown content
 */
export function replaceCodestatsSection(
  markdown: string,
  content: string,
  header: string = '',
  footer: string = ''
): string {
  // Ensure all parameters are strings
  if (typeof markdown !== 'string') {
    console.error('replaceCodestatsSection: markdown must be a string');
    return '';
  }
  if (typeof content !== 'string') content = '';
  if (typeof header !== 'string') header = '';
  if (typeof footer !== 'string') footer = '';

  const replacement = `<!-- START_SECTION:codestats -->\n${header}\`\`\`text\n${content}\`\`\`\n${footer}<!-- END_SECTION:codestats -->`;
  return markdown.replace(
    /((<!--.*START_SECTION:codestats.*-->)([\s\S]+)(<!--.*END_SECTION:codestats.*-->))/g,
    replacement
  );
}

/**
 * Create update readme function
 */
export function makeUpdateReadme(opts: AppOptions): UpdateReadmeFunction {
  return function (content: string, callback: () => void): void {
    fs.readFile(opts.readmeFile, 'utf8', (err, data) => {
      const header = opts.show.title
        ? `*Language experience level (Last update ${new Date().toUTCString()})*\n\n`
        : '';
      const footer = opts.show.link
        ? `\n> My [CodeStats profile](${opts.codestats.profile}) in detail.\n`
        : '';

      if (err) {
        console.error('Error reading README file:', err);
        callback();
        return;
      }

      const result = replaceCodestatsSection(data || '', content, header, footer);

      fs.writeFile(opts.readmeFile, result, 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing README file:', writeErr);
        }
        callback();
      });
    });
  };
}

/**
 * Start the action if called directly
 */
export async function start(): Promise<void> {
  try {
    const opts = createOptions();
    const callback = makeCallback(opts);

    const response = await fetch(opts.codestats.url);
    if (response.ok) {
      const body = await response.text();
      callback(null, { statusCode: response.status }, body);
    } else {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      callback(error, { statusCode: response.status }, null);
    }
  } catch (error) {
    console.error('Application failed:', error);
    process.exit(1);
  }
}

// Init request if called directly
if (require.main === module) {
  start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
