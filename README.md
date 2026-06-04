# oss-maintainer-snapshot

Small GitHub CLI based snapshot tool for open source maintenance queues.

It reads open issues and pull requests from one or more repositories and prints
a compact report that is useful before a maintenance pass: what needs triage,
what needs review, and which links should be checked first.

## Why

Maintainers often need a quick, repeatable way to see what changed across a
small set of public repositories without opening every project manually. This
tool keeps that workflow simple and transparent by using the official `gh` CLI
that many maintainers already have authenticated.

## Requirements

- Node.js 20 or newer
- GitHub CLI (`gh`)
- `gh auth login` completed for private or notification-aware work

## Usage

Markdown output is the default:

```bash
oss-maintainer-snapshot --repo vaguul/discord-command-controls --limit 10
```

JSON output:

```bash
oss-maintainer-snapshot --repo vaguul/social-feed-inputs --format json
```

Only show items updated on or after a date:

```bash
oss-maintainer-snapshot --repo vaguul/discord-command-controls --since 2026-06-01
```

Write the report to a file:

```bash
oss-maintainer-snapshot \
  --repo vaguul/discord-command-controls \
  --repo vaguul/social-feed-inputs \
  --output maintainer-snapshot.md
```

## Options

| Option | Description |
| --- | --- |
| `--repo owner/name` | Repository to include. Can be repeated. |
| `--limit number` | Max issues and PRs per repo. Defaults to `20`. |
| `--since YYYY-MM-DD` | Keep only items updated on or after this UTC date. |
| `--format markdown,json` | Output format. Defaults to `markdown`. |
| `--output path` | Write the report to a file instead of stdout. |
| `--help` | Print help. |

## Scheduled GitHub Actions usage

You can run the snapshot on a schedule and upload the Markdown report as an
artifact. See [`examples/scheduled-github-actions.yml`](examples/scheduled-github-actions.yml)
for a copy-ready workflow.

The workflow installs the tool from a GitHub release tag because this package is
not currently published to npm. The package `prepare` script builds the CLI
during that install:

```bash
npm install --global github:vaguul/oss-maintainer-snapshot#v0.1.3
```

Authentication is still handled by the `gh` CLI. In GitHub Actions:

- `GITHUB_TOKEN` is enough for many public repository snapshots and current-repo
  automation.
- use a read-only personal access token stored as
  `MAINTAINER_SNAPSHOT_TOKEN` when the workflow needs private repositories,
  cross-organization access, or notification-aware results.
- the token should only need read access to metadata, issues, and pull requests.

## Attention grouping

The Markdown and JSON reports keep the raw issue and pull request lists visible,
but also add a `Needs attention` group before them. Items appear there when:

- a pull request requires review
- a pull request has a non-clean merge state
- an issue has labels such as `bug`, `security`, `regression`, `triage`, or `to-triage`

## Local development

```bash
npm install
npm test
```

## Notes

This is intentionally a read-only tool. It does not post comments, modify
issues, or change repository settings. It only calls `gh issue list` and
`gh pr list`, then formats the result.
