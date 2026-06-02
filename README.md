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

```bash
npx oss-maintainer-snapshot --repo owner/project --repo owner/another-project
```

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

## Options

| Option | Description |
| --- | --- |
| `--repo owner/name` | Repository to include. Can be repeated. |
| `--limit number` | Max issues and PRs per repo. Defaults to `20`. |
| `--since YYYY-MM-DD` | Keep only items updated on or after this UTC date. |
| `--format markdown,json` | Output format. Defaults to `markdown`. |
| `--help` | Print help. |

## Local development

```bash
npm install
npm test
```

## Notes

This is intentionally a read-only tool. It does not post comments, modify
issues, or change repository settings. It only calls `gh issue list` and
`gh pr list`, then formats the result.
