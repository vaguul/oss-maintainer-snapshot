import type { IssueItem, PullRequestItem, RepoSnapshot, SnapshotReport } from "./types.js";

function labelNames(item: IssueItem): string {
  const names = item.labels?.map((label) => label.name).filter(Boolean) ?? [];
  return names.length > 0 ? ` [${names.join(", ")}]` : "";
}

function sortByUpdated<T extends IssueItem>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
}

function formatIssue(item: IssueItem): string {
  return `- #${item.number} ${item.title}${labelNames(item)} - ${item.url}`;
}

function formatPullRequest(item: PullRequestItem): string {
  const signals = [
    item.reviewDecision ? `review: ${item.reviewDecision}` : "",
    item.mergeStateStatus ? `merge: ${item.mergeStateStatus}` : ""
  ].filter(Boolean);

  const suffix = signals.length > 0 ? ` (${signals.join(", ")})` : "";
  return `- #${item.number} ${item.title}${suffix}${labelNames(item)} - ${item.url}`;
}

export function buildReport(repos: RepoSnapshot[], now = new Date()): SnapshotReport {
  return {
    generatedAt: now.toISOString(),
    repos: repos.map((repo) => ({
      repo: repo.repo,
      issues: sortByUpdated(repo.issues),
      pullRequests: sortByUpdated(repo.pullRequests)
    }))
  };
}

export function formatMarkdown(report: SnapshotReport): string {
  const lines = [
    "# OSS Maintainer Snapshot",
    "",
    `Generated: ${report.generatedAt}`,
    ""
  ];

  for (const repo of report.repos) {
    lines.push(`## ${repo.repo}`, "");

    lines.push("### Open pull requests");
    if (repo.pullRequests.length === 0) {
      lines.push("- No open pull requests.");
    } else {
      lines.push(...repo.pullRequests.map(formatPullRequest));
    }
    lines.push("");

    lines.push("### Open issues");
    if (repo.issues.length === 0) {
      lines.push("- No open issues.");
    } else {
      lines.push(...repo.issues.map(formatIssue));
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function formatJson(report: SnapshotReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
