# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| 0.2.x   | :white_check_mark: |
| < 0.2   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please send an email to the maintainers or open a GitHub issue with the label `security`.

We will respond within 48 hours.

## Security Best Practices

- Keep your `OPENCLAW_TOKEN` and `KANCLAW_AUTH_TOKEN` secure
- Use environment variables, never commit secrets
- Run `npm run audit` regularly to check for vulnerabilities
- Keep dependencies updated

```bash
# Audit dependencies
npm audit

# Update dependencies
npm update
```
