import type {
  AttentionItem,
  IssueItem,
  PullRequestItem,
  RepoSnapshot,
  SnapshotReport
} from "./types.js";

const attentionLabels = new Set([
  "bug",
  "critical",
  "high priority",
  "needs triage",
  "regression",
  "security",
  "to-triage",
  "triage"
]);

function labelNames(item: IssueItem): string {
  const names = item.labels?.map((label) => label.name).filter(Boolean) ?? [];
  return names.length > 0 ? ` [${names.join(", ")}]` : "";
}

function sortByUpdated<T extends IssueItem>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
}

function filterBySince<T extends IssueItem>(items: T[], since?: Date): T[] {
  if (!since) {
    return items;
  }

  const cutoff = since.getTime();
  return items.filter((item) => Date.parse(item.updatedAt) >= cutoff);
}

function normalizedLabels(item: IssueItem): string[] {
  return item.labels?.map((label) => label.name.trim().toLowerCase()) ?? [];
}

function issueAttentionReasons(item: IssueItem): string[] {
  const labels = normalizedLabels(item);
  const matches = labels.filter((label) => attentionLabels.has(label));
  return matches.map((label) => `label: ${label}`);
}

function pullRequestAttentionReasons(item: PullRequestItem): string[] {
  const reasons: string[] = [];

  if (item.reviewDecision === "REVIEW_REQUIRED") {
    reasons.push("review required");
  }

  if (item.mergeStateStatus && item.mergeStateStatus !== "CLEAN") {
    reasons.push(`merge state: ${item.mergeStateStatus.toLowerCase()}`);
  }

  return reasons;
}

function buildAttention(
  issues: IssueItem[],
  pullRequests: PullRequestItem[]
): AttentionItem[] {
  const issueItems = issues
    .map((issue) => ({
      kind: "issue" as const,
      number: issue.number,
      title: issue.title,
      url: issue.url,
      reasons: issueAttentionReasons(issue)
    }))
    .filter((item) => item.reasons.length > 0);

  const pullRequestItems = pullRequests
    .map((pullRequest) => ({
      kind: "pull_request" as const,
      number: pullRequest.number,
      title: pullRequest.title,
      url: pullRequest.url,
      reasons: pullRequestAttentionReasons(pullRequest)
    }))
    .filter((item) => item.reasons.length > 0);

  return [...pullRequestItems, ...issueItems];
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

function formatAttention(item: AttentionItem): string {
  const kind = item.kind === "pull_request" ? "PR" : "Issue";
  return `- ${kind} #${item.number} ${item.title} (${item.reasons.join(", ")}) - ${item.url}`;
}

export function buildReport(
  repos: RepoSnapshot[],
  now = new Date(),
  since?: Date
): SnapshotReport {
  return {
    generatedAt: now.toISOString(),
    repos: repos.map((repo) => {
      const issues = sortByUpdated(filterBySince(repo.issues, since));
      const pullRequests = sortByUpdated(filterBySince(repo.pullRequests, since));

      return {
        repo: repo.repo,
        attention: buildAttention(issues, pullRequests),
        issues,
        pullRequests
      };
    })
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

    lines.push("### Needs attention");
    if (repo.attention.length === 0) {
      lines.push("- No attention items.");
    } else {
      lines.push(...repo.attention.map(formatAttention));
    }
    lines.push("");

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
