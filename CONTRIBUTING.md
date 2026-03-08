# Contributing to AlphaClaw

Thanks for your interest in contributing to AlphaClaw. This document covers how we work, what we value, and how to get your changes merged.

## Vision

AlphaClaw makes OpenClaw accessible: easy to deploy, easy to monitor, easy to repair, easy to keep running. Self-managed and open source, always.

One-click deployment templates come and go. The self-managed aspect is what makes this durable.

### Guiding Principles

- **UX over features.** Usability matters more than feature count. Every interaction should feel considered.
- **Smart defaults.** AlphaClaw is opinionated. We bootstrap hooks, prompt hardening, and sensible configs so the out-of-box experience is good without manual tuning.
- **Complement, don't replicate.** OpenClaw's Gateway dashboard is exhaustive. We surface the most common workflows and add net-new value, not duplicate switches.
- **Always ejectable.** AlphaClaw is not a dependency. Remove it and your OpenClaw instance keeps running. Nothing proprietary, nothing to migrate.
- **Reliability is a feature.** The watchdog, auto-repair, crash-loop recovery - these matter as much as any UI improvement.

## What We're Looking For

### Always welcome

- Bug fixes
- Reliability improvements (watchdog, crash recovery, gateway management)
- Test coverage
- Documentation fixes and clarifications

### Welcome, but reviewed carefully

- UX changes and small features
- New integrations or wizard steps
- Bootstrap prompt improvements

### Proposal first

- Large features or architectural changes
- New paradigms (e.g., plugin system changes, new deployment targets)
- Anything that changes the default experience significantly

For big changes, open an issue describing what you want to build, why, and your proposed approach. This saves everyone time.

## Getting Started

### Prerequisites

- Node.js >= 22.12.0
- Git

### Setup

```bash
git clone https://github.com/chrysb/alphaclaw.git
cd alphaclaw
npm install
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

AlphaClaw uses [Vitest](https://vitest.dev/) for testing.

### Project Structure

- `bin/` - CLI entrypoint (`alphaclaw.js`)
- `lib/` - Core library (gateway manager, watchdog, setup UI, webhooks, etc.)
- `tests/` - Test suites

## Submitting Changes

### Pull Request Process

1. Fork the repo and create a branch from `main`.
2. Make your changes. Write tests if applicable.
3. Run `npm test` and make sure everything passes.
4. Write a clear PR description: what changed, why, and how to test it.
5. Sign off your commits (see DCO below).

### Commit Messages

Keep them clear and concise. Prefix with the area when it helps:

```text
watchdog: recover from port conflict on restart
setup-ui: fix credential validation for Gemini provider
docs: clarify Railway deployment steps
```

### Code Style

- Match the existing style. If something looks inconsistent, follow what the majority of the codebase does.
- No unnecessary dependencies. AlphaClaw ships lean on purpose.

## Developer Certificate of Origin (DCO)

We use the [DCO](https://developercertificate.org/) to certify that contributors have the right to submit their code under this project's MIT license.

Add a sign-off line to each commit:

```text
Signed-off-by: Your Name <your.email@example.com>
```

Git makes this easy:

```bash
git commit -s -m "your commit message"
```

The `-s` flag adds the sign-off automatically using your configured `user.name` and `user.email`.

## Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) (v2.1).

The short version: be respectful, be constructive, assume good intent. We're building something useful together.

## Questions?

Open an issue or start a discussion on the repo. We're happy to help you find the right place to contribute.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
