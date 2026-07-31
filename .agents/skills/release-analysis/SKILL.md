---
name: release-analysis
description: Analyze an upstream product, dependency, or platform release for downstream impact on the current repo. Use when the user gives a package or repo name such as `openclaw` or `GOG-CLI`, or asks about release notes, changelogs, tags, dependency bumps, or upstream announcements. Resolve the GitHub repository, read the latest release or tag notes, and assess breaking changes, redundant features, new opportunities, test needs, and recommended follow-up work for a wrapper or integration product such as AlphaClaw relative to OpenClaw.
---

# Release Analysis

## Goal

Turn upstream release notes into a downstream product assessment:

- What could break
- What becomes redundant
- What gets easier to support or expose
- What should be updated, tested, or ignored

Default to a product-and-maintainer lens, not a changelog summary.

The user may provide only a package or repo name. In that case, resolve the upstream repository first, then inspect the latest release or tag notes before analyzing impact.

## Workflow

1. Start from the package or repo name the user gave.
2. Resolve the canonical upstream repository.
3. Open the repository's latest stable release notes. If needed, use the tags page to find the newest relevant release/tag and read its notes.
4. Identify how this repo depends on or wraps that upstream project.
5. Separate automatic benefits from places where this repo has its own assumptions.
6. Look for regressions, redundancy, opportunity, and maintenance work.
7. End with concrete recommended actions.

## Resolving The Repo

When the user provides only a package or repo name:

1. Prefer the canonical GitHub repository for that package.
2. If the package name is ambiguous, use package metadata, project docs, or the dependency declaration in this repo to confirm the source.
3. If multiple plausible repos exist and you cannot confidently resolve the right one, ask one short clarifying question before continuing.

Default to GitHub releases/tags as the source of truth for the analysis when available.

## Find The Release Notes

Use this order:

1. Latest stable GitHub release page
2. Latest relevant tag page if the project publishes notes on tags
3. Release notes linked from the repository if GitHub has no usable notes

Prefer the latest stable release unless the user explicitly asks about beta, prerelease, or a specific version.

## Gather Context

Read only what is needed:

- The release notes or announcement from the latest release/tag
- `AGENTS.md` and nearby project guidance
- `package.json` or dependency pins
- Version/update code paths
- Any UI, route, or service files that expose the affected area
- Tests covering the affected area, when the release looks risky

For AlphaClaw specifically, check whether the upstream change touches:

- OpenClaw version/update handling
- gateway lifecycle or restart behavior
- setup and onboarding flows
- channel integrations such as Telegram or Discord
- model/provider configuration
- browser, proxy, or remote-control flows
- watchdog, repair, or recovery behavior

## What To Look For

### Breaking Changes

Look for:

- CLI output changes that AlphaClaw parses
- JSON schema or response-shape changes
- renamed config keys, env vars, commands, flags, or routes
- behavior changes that break existing assumptions
- dependency tree changes that can affect runtime resolution
- changes that require migration, restart, rebuild, or cache invalidation

Do not stop at explicit "breaking changes" headings. Many breaks are implied by wording like:

- "now returns"
- "renamed"
- "moved"
- "deprecated"
- "re-enabled"
- "no longer"
- "defaults to"
- "installer now"

### Redundancy Risk

Check whether the upstream release makes part of this repo less necessary:

- AlphaClaw workaround replaced by native upstream support
- AlphaClaw setup UX duplicated by upstream onboarding
- AlphaClaw guardrail duplicated by upstream validation
- AlphaClaw integration logic replaced by upstream first-class feature

If a feature is partly redundant, say whether AlphaClaw still adds value through:

- simpler UX
- better defaults
- safer operations
- multi-step orchestration
- cross-feature visibility
- recovery/monitoring

### Opportunity

Look for upstream features AlphaClaw could make easier to use:

- new CLI capability worth exposing in UI or API
- new config field worth surfacing in setup
- new repair, backup, or diagnostics flows worth wrapping
- new provider/model/channel support worth highlighting
- fixes that allow AlphaClaw to remove brittle code or simplify messaging

### Maintenance Work

Check whether this repo should update:

- pinned dependency versions
- version parsing or changelog links
- feature labels, model names, defaults, or hints
- onboarding copy and docs
- tests covering assumptions that changed
- release or rebuild guidance in `AGENTS.md`

## Assessment Rules

Use these categories:

- `Breaks us`: likely regression or incompatibility
- `Needs update`: not broken, but this repo should change
- `Benefits automatically`: upstream improvement with no AlphaClaw work needed
- `Potential product opportunity`: good candidate for follow-up UX/API work
- `No material impact`: not meaningfully relevant to this repo

Be explicit about confidence:

- `High confidence` when code paths were checked directly
- `Medium confidence` when the conclusion is inferred from release notes plus repo structure
- `Low confidence` when the area was not validated in code

## Output Format

Default to a brief memo.

Use this structure:

```markdown
## Release Impact

### Breaks / Risks
- ...

### Needs Update
- ...

### Redundancy / Product Positioning
- ...

### Opportunities
- ...

### Recommended Actions
1. ...
2. ...
3. ...

### Confidence / Gaps
- ...
```

If no clear risk is found, say that explicitly. Do not invent breakage just to be balanced.

## AlphaClaw Heuristics

For AlphaClaw, pay extra attention to these recurring failure modes:

- OpenClaw version strings or update status output changing shape
- child-process lifecycle changes affecting restart, shutdown, or health checks
- dependency resolution changes that can hoist incompatible Express versions
- model catalog/provider naming drift causing stale labels or featured-model picks
- upstream channel changes that alter Telegram, Discord, or pairing assumptions
- browser/relay/network changes that affect proxying or remote access workflows

Also ask:

- Does AlphaClaw currently expose this capability at all?
- If not, should it?
- If yes, is AlphaClaw now adding value or just repeating upstream UX?

## Decision Guidance

Recommend a dependency/version bump when:

- the release mostly improves stability or fixes bugs in areas AlphaClaw already depends on
- there are no obvious compatibility blockers

Recommend delaying a bump when:

- AlphaClaw parses changed output or schemas and has not been updated
- the release changes runtime assumptions that need validation first
- the release appears to supersede or conflict with AlphaClaw-managed flows

## Keep It Tight

Do not rewrite the whole release note.

Prefer:

- downstream impact
- specific repo evidence
- short recommended actions

Over:

- exhaustive upstream summaries
- generic praise
- speculation without code or note support
