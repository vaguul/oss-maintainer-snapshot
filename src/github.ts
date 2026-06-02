import { execFileSync } from "node:child_process";
import type { IssueItem, PullRequestItem, RepoSnapshot } from "./types.js";

type GhRunner = (args: string[]) => string;

const defaultRunner: GhRunner = (args) =>
  execFileSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

function parseJsonList<T>(raw: string, label: string): T[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error(`${label} did not return a JSON array`);
    }
    return parsed as T[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not parse ${label}: ${message}`);
  }
}

export function collectRepoSnapshot(
  repo: string,
  limit: number,
  runGh: GhRunner = defaultRunner
): RepoSnapshot {
  const issueJson = runGh([
    "issue",
    "list",
    "--repo",
    repo,
    "--state",
    "open",
    "--limit",
    String(limit),
    "--json",
    "number,title,updatedAt,url,labels"
  ]);

  const prJson = runGh([
    "pr",
    "list",
    "--repo",
    repo,
    "--state",
    "open",
    "--limit",
    String(limit),
    "--json",
    "number,title,updatedAt,url,labels,mergeStateStatus,reviewDecision"
  ]);

  return {
    repo,
    issues: parseJsonList<IssueItem>(issueJson, `${repo} issues`),
    pullRequests: parseJsonList<PullRequestItem>(prJson, `${repo} pull requests`)
  };
}
