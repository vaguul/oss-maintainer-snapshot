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
    "--format",
    "json"
  ]);

  assert.deepEqual(options.repos, [
    "vaguul/discord-command-controls",
    "vaguul/social-feed-inputs"
  ]);
  assert.equal(options.limit, 5);
  assert.equal(options.format, "json");
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

test("formatJson returns stable pretty JSON", () => {
  const report = buildReport([], new Date("2026-06-02T00:00:00.000Z"));
  const parsed = JSON.parse(formatJson(report));

  assert.equal(parsed.generatedAt, "2026-06-02T00:00:00.000Z");
  assert.deepEqual(parsed.repos, []);
});
