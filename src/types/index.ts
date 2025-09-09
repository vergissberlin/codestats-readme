export interface CodeStatsUser {
  readonly username: string;
  readonly url: string;
  readonly profile: string;
}

export interface GitConfig {
  readonly username: string;
  readonly message: string;
  readonly token: string;
}

export interface GraphConfig {
  readonly width: number;
}

export interface ShowConfig {
  readonly title: boolean;
  readonly link: boolean;
}

export interface AppOptions {
  readonly codestats: CodeStatsUser;
  readonly git: GitConfig;
  readonly graph: GraphConfig;
  readonly readmeFile: string;
  readonly show: ShowConfig;
}

export interface LanguageData {
  readonly xps: number;
  readonly level?: number;
  readonly [key: string]: unknown;
}

export interface Languages {
  readonly [languageName: string]: LanguageData;
}

export interface CodeStatsApiResponse {
  readonly user: {
    readonly username: string;
    readonly total_xp: number;
    readonly [key: string]: unknown;
  };
  readonly languages: Languages;
  readonly [key: string]: unknown;
}

export interface LanguageEntry {
  readonly name: string;
  readonly xps: number;
}

export type LanguageChart = Record<string, number>;

export interface HttpResponse {
  readonly statusCode: number;
  readonly [key: string]: unknown;
}

export type RequestCallback = (
  error: Error | null,
  response: HttpResponse | null,
  body: string | null
) => void;

export interface EnvironmentVariables {
  readonly INPUT_CODESTATS_USERNAME?: string;
  readonly GITHUB_ACTOR?: string;
  readonly INPUT_COMMIT_MESSAGE?: string;
  readonly INPUT_GITHUB_TOKEN?: string;
  readonly INPUT_GRAPH_WIDTH?: string;
  readonly INPUT_README_FILE?: string;
  readonly INPUT_SHOW_TITLE?: string;
  readonly INPUT_SHOW_LINK?: string;
  readonly INPUT_DEBUG?: string;
}

export interface BarsOptions {
  readonly bar: string;
  readonly width: number;
}

export interface FileError {
  readonly errno?: number;
  readonly code?: string;
  readonly syscall?: string;
  readonly path?: string;
}

export type UpdateReadmeFunction = (content: string, callback: () => void) => void;

export type CommitChangesFunction = () => void;

// Re-export commonly used types
export type { SimpleGit } from 'simple-git';
