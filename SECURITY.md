# Security Policy

## Supported Versions

Security fixes target the latest release.

## Reporting a Vulnerability

Please do not open a public issue with secrets, tokens, private repository data,
or exploit details.

Report security concerns privately to the maintainer using the contact method on
the Vaguul GitHub profile or portfolio.

Include:

- the affected version or commit
- the command or workflow shape involved
- whether private repository data, tokens, or GitHub Actions secrets may be exposed
- a minimal reproduction that does not include real secrets

## Security Model

`oss-maintainer-snapshot` is designed as a read-only CLI. It shells out to the
GitHub CLI and reads issue and pull request metadata, then formats a local
report.

It should not:

- post comments
- edit issues or pull requests
- change repository settings
- persist tokens
- print token values

Use the least-privileged token that can read the target repositories. For GitHub
Actions, prefer `GITHUB_TOKEN` for public/current-repository snapshots and a
read-only fine-grained token only when cross-repository or private access is
needed.
