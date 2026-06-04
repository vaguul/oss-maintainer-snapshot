import assert from "node:assert/strict";
import { test } from "node:test";
import { buildReport, formatJson, formatMarkdown } from "../src/report.js";
import { parseArgs } from "../src/cli.js";

test("parseArgs accepts repeated repositories", () => {
  const options = parseArgs([
    "--repo",
    "vaguul/discord-command-controls",
    "--repo",
    "vaguul/social-feed-inputs",
    "--limit",
    "5",
    "--since",
    "2026-06-01",
    "--format",
    "json",
    "--output",
    "snapshot.json"
  ]);

  assert.deepEqual(options.repos, [
    "vaguul/discord-command-controls",
    "vaguul/social-feed-inputs"
  ]);
  assert.equal(options.limit, 5);
  assert.equal(options.since?.toISOString(), "2026-06-01T00:00:00.000Z");
  assert.equal(options.format, "json");
  assert.equal(options.outputPath, "snapshot.json");
});

test("formatMarkdown prints empty queues clearly", () => {
  const report = buildReport(
    [
      {
        repo: "vaguul/example",
        issues: [],
        pullRequests: []
      }
    ],
    new Date("2026-06-02T00:00:00.000Z")
  );

  const markdown = formatMarkdown(report);

  assert.match(markdown, /Generated: 2026-06-02T00:00:00.000Z/);
  assert.match(markdown, /## vaguul\/example/);
  assert.match(markdown, /No attention items/);
  assert.match(markdown, /No open pull requests/);
  assert.match(markdown, /No open issues/);
});

test("buildReport sorts issues and pull requests by updatedAt descending", () => {
  const report = buildReport(
    [
      {
        repo: "vaguul/example",
        issues: [
          {
            number: 1,
            title: "Older issue",
            updatedAt: "2026-06-01T00:00:00.000Z",
            url: "https://example.test/issues/1"
          },
          {
            number: 2,
            title: "Newer issue",
            updatedAt: "2026-06-02T00:00:00.000Z",
            url: "https://example.test/issues/2"
          }
        ],
        pullRequests: [
          {
            number: 3,
            title: "Older PR",
            updatedAt: "2026-06-01T00:00:00.000Z",
            url: "https://example.test/pulls/3"
          },
          {
            number: 4,
            title: "Newer PR",
            updatedAt: "2026-06-02T00:00:00.000Z",
            url: "https://example.test/pulls/4"
          }
        ]
      }
    ],
    new Date("2026-06-02T00:00:00.000Z")
  );

  assert.equal(report.repos[0]?.issues[0]?.number, 2);
  assert.equal(report.repos[0]?.pullRequests[0]?.number, 4);
});

test("buildReport filters issues and pull requests by since date", () => {
  const report = buildReport(
    [
      {
        repo: "vaguul/example",
        issues: [
          {
            number: 1,
            title: "Older issue",
            updatedAt: "2026-05-31T23:59:59.000Z",
            url: "https://example.test/issues/1"
          },
          {
            number: 2,
            title: "Recent issue",
            updatedAt: "2026-06-01T00:00:00.000Z",
            url: "https://example.test/issues/2"
          }
        ],
        pullRequests: [
          {
            number: 3,
            title: "Older PR",
            updatedAt: "2026-05-31T23:59:59.000Z",
            url: "https://example.test/pulls/3"
          },
          {
            number: 4,
            title: "Recent PR",
            updatedAt: "2026-06-01T00:00:00.000Z",
            url: "https://example.test/pulls/4"
          }
        ]
      }
    ],
    new Date("2026-06-02T00:00:00.000Z"),
    new Date("2026-06-01T00:00:00.000Z")
  );

  assert.deepEqual(
    report.repos[0]?.issues.map((issue) => issue.number),
    [2]
  );
  assert.deepEqual(
    report.repos[0]?.pullRequests.map((pullRequest) => pullRequest.number),
    [4]
  );
});

test("buildReport groups attention items before raw queues", () => {
  const report = buildReport(
    [
      {
        repo: "vaguul/example",
        issues: [
          {
            number: 1,
            title: "Needs triage",
            updatedAt: "2026-06-02T00:00:00.000Z",
            url: "https://example.test/issues/1",
            labels: [{ name: "to-triage" }]
          },
          {
            number: 2,
            title: "Normal issue",
            updatedAt: "2026-06-02T00:00:00.000Z",
            url: "https://example.test/issues/2",
            labels: [{ name: "question" }]
          }
        ],
        pullRequests: [
          {
            number: 3,
            title: "Blocked PR",
            updatedAt: "2026-06-02T00:00:00.000Z",
            url: "https://example.test/pulls/3",
            mergeStateStatus: "DIRTY",
            reviewDecision: "REVIEW_REQUIRED"
          }
        ]
      }
    ],
    new Date("2026-06-02T00:00:00.000Z")
  );

  assert.deepEqual(
    report.repos[0]?.attention.map((item) => item.number),
    [3, 1]
  );

  const markdown = formatMarkdown(report);
  assert.match(markdown, /### Needs attention/);
  assert.match(markdown, /PR #3 Blocked PR \(review required, merge state: dirty\)/);
  assert.match(markdown, /Issue #1 Needs triage \(label: to-triage\)/);
  assert.match(markdown, /### Open pull requests/);
  assert.match(markdown, /### Open issues/);
});

test("formatJson returns stable pretty JSON", () => {
  const report = buildReport([], new Date("2026-06-02T00:00:00.000Z"));
  const parsed = JSON.parse(formatJson(report));

  assert.equal(parsed.generatedAt, "2026-06-02T00:00:00.000Z");
  assert.deepEqual(parsed.repos, []);
});
