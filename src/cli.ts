#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { collectRepoSnapshot } from "./github.js";
import { buildReport, formatJson, formatMarkdown } from "./report.js";
import type { CliOptions, OutputFormat } from "./types.js";

const usage = `Usage: oss-maintainer-snapshot --repo owner/name [--repo owner/other] [--limit 20] [--since YYYY-MM-DD] [--format markdown|json]

Options:
  --repo owner/name       Repository to include. Can be repeated.
  --limit number          Max issues and PRs per repository. Default: 20.
  --since YYYY-MM-DD      Keep only items updated on or after this UTC date.
  --format markdown|json  Output format. Default: markdown.
  --help                  Show this help text.
`;

function readValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    repos: [],
    limit: 20,
    format: "markdown"
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help") {
      console.log(usage);
      process.exit(0);
    }

    if (arg === "--repo") {
      options.repos.push(readValue(args, index, arg));
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      const raw = readValue(args, index, arg);
      const limit = Number.parseInt(raw, 10);
      if (!Number.isInteger(limit) || limit < 1) {
        throw new Error("--limit must be a positive integer");
      }
      options.limit = limit;
      index += 1;
      continue;
    }

    if (arg === "--format") {
      const format = readValue(args, index, arg);
      if (format !== "markdown" && format !== "json") {
        throw new Error("--format must be markdown or json");
      }
      options.format = format as OutputFormat;
      index += 1;
      continue;
    }

    if (arg === "--since") {
      const raw = readValue(args, index, arg);
      const since = new Date(`${raw}T00:00:00.000Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(since.getTime())) {
        throw new Error("--since must use YYYY-MM-DD");
      }
      options.since = since;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.repos.length === 0) {
    throw new Error("At least one --repo value is required");
  }

  return options;
}

function main(): void {
  try {
    const options = parseArgs(process.argv.slice(2));
    const snapshots = options.repos.map((repo) =>
      collectRepoSnapshot(repo, options.limit)
    );
    const report = buildReport(snapshots, new Date(), options.since);
    const output = options.format === "json" ? formatJson(report) : formatMarkdown(report);
    process.stdout.write(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n\n${usage}`);
    process.exitCode = 1;
  }
}

const entrypoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entrypoint) {
  main();
}
