export type OutputFormat = "markdown" | "json";

export interface CliOptions {
  repos: string[];
  limit: number;
  format: OutputFormat;
  outputPath?: string;
  since?: Date;
}

export interface Label {
  name: string;
  color?: string;
}

export interface IssueItem {
  number: number;
  title: string;
  updatedAt: string;
  url: string;
  labels?: Label[];
}

export interface PullRequestItem extends IssueItem {
  mergeStateStatus?: string;
  reviewDecision?: string;
}

export interface AttentionItem {
  kind: "issue" | "pull_request";
  number: number;
  title: string;
  url: string;
  reasons: string[];
}

export interface RepoSnapshot {
  repo: string;
  issues: IssueItem[];
  pullRequests: PullRequestItem[];
}

export interface RepoReport extends RepoSnapshot {
  attention: AttentionItem[];
}

export interface SnapshotReport {
  generatedAt: string;
  repos: RepoReport[];
}
