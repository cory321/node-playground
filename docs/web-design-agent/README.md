# Web Design Agent Implementation Plans

This directory contains 17 focused implementation plans broken out from the master Web Design Agent architecture. Each plan is designed to be executable by an AI agent with 10-20 actionable subtasks.

## Quick Start

1. **Read the overview first**: [00-architecture-overview.md](./00-architecture-overview.md)
2. **Start with infrastructure**: [01-infrastructure-setup.md](./01-infrastructure-setup.md)
3. **Follow the dependency order** shown below

---

## Plan Index

| # | Plan | Tasks | Est. Time | Dependencies |
|---|------|-------|-----------|--------------|
| 00 | [Architecture Overview](./00-architecture-overview.md) | Reference | — | None |
| 01 | [Infrastructure Setup](./01-infrastructure-setup.md) | 15 | 2-3h | None |
| 02 | [Category Presets](./02-category-presets.md) | 14 | 2-3h | 01 |
| 03 | [Identity Generation](./03-identity-generation.md) | 10 | 2-3h | 01 |
| 04 | [Reference Image Generation](./04-reference-image-generation.md) | 11 | 3-4h | 01, 02 |
| 05 | [Design Token Extraction](./05-design-token-extraction.md) | 10 | 2-3h | 01, 04 |
| 06 | [Content Strategy](./06-content-strategy.md) | 9 | 2-3h | 01, 03 |
| 07 | [Design Approval UI](./07-design-approval-ui.md) | 10 | 3-4h | 03-06 |
| 08 | [Hero Generation](./08-hero-generation.md) | 9 | 3-4h | 05, 06 |
| 09 | [Section Generation](./09-section-generation.md) | 9 | 4-5h | 05, 06, 08 |
| 10 | [Refinement & Assembly](./10-refinement-assembly.md) | 9 | 3-4h | 08, 09 |
| 11 | [GitHub Integration](./11-github-integration.md) | 7 | 2-3h | 10 |
| 12 | [Vercel Deployment](./12-vercel-deployment.md) | 7 | 2-3h | 11 |
| 13 | [Preview Approval UI](./13-preview-approval-ui.md) | 7 | 2-3h | 12 |
| 14 | [Anti-Slop Validation](./14-anti-slop-validation.md) | 7 | 2-3h | 08 |
| 15 | [Frontend Orchestration](./15-frontend-orchestration.md) | 9 | 4-5h | All |
| 16 | [Node Architecture](./16-node-architecture.md) | 25 | 4-5h | All |

**Total: ~155 subtasks across 16 implementation plans**

---

## Dependency Graph

```
                    ┌─────────────────────────────────────────────────────┐
                    │              01: Infrastructure                      │
                    └─────────────────────────────────────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              ▼                           ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
    │ 02: Presets     │         │ 03: Identity    │         │                 │
    └─────────────────┘         └─────────────────┘         │                 │
              │                           │                 │                 │
              ▼                           ▼                 │                 │
    ┌─────────────────┐         ┌─────────────────┐         │                 │
    │ 04: Ref Image   │         │ 06: Content     │         │                 │
    └─────────────────┘         └─────────────────┘         │                 │
              │                           │                 │                 │
              ▼                           │                 │                 │
    ┌─────────────────┐                   │                 │                 │
    │ 05: Tokens      │───────────────────┘                 │                 │
    └─────────────────┘                                     │                 │
              │                                             │                 │
              └──────────────────┬──────────────────────────┘                 │
                                 ▼                                            │
                    ┌─────────────────────────────────────────────────────┐   │
                    │              07: Design Approval UI                  │   │
                    └─────────────────────────────────────────────────────┘   │
                                          │                                   │
                                          ▼                                   │
                    ┌─────────────────────────────────────────────────────┐   │
                    │              08: Hero Generation                     │◄──┤
                    └─────────────────────────────────────────────────────┘   │
                                          │                                   │
              ┌───────────────────────────┼───────────────────────────────┐   │
              ▼                           ▼                               │   │
    ┌─────────────────┐         ┌─────────────────┐                       │   │
    │ 09: Sections    │         │ 14: Anti-Slop   │                       │   │
    └─────────────────┘         └─────────────────┘                       │   │
              │                                                           │   │
              ▼                                                           │   │
    ┌─────────────────┐                                                   │   │
    │ 10: Assembly    │                                                   │   │
    └─────────────────┘                                                   │   │
              │                                                           │   │
              ▼                                                           │   │
    ┌─────────────────┐                                                   │   │
    │ 11: GitHub      │                                                   │   │
    └─────────────────┘                                                   │   │
              │                                                           │   │
              ▼                                                           │   │
    ┌─────────────────┐                                                   │   │
    │ 12: Vercel      │                                                   │   │
    └─────────────────┘                                                   │   │
              │                                                           │   │
              ▼                                                           │   │
    ┌─────────────────┐                                                   │   │
    │ 13: Preview UI  │                                                   │   │
    └─────────────────┘                                                   │   │
              │                                                           │   │
              └───────────────────────────┬───────────────────────────────┘   │
                                          ▼                                   │
                    ┌─────────────────────────────────────────────────────┐   │
                    │              15: Frontend Orchestration              │◄──┘
                    └─────────────────────────────────────────────────────┘
```

---

## Parallelization Opportunities

These plan pairs can be worked on simultaneously:

1. **02 + 03** — Category presets and identity generation (after 01)
2. **03 + 04** — Identity and reference image (after 01, 02)
3. **05 + 06** — Design tokens and content (after 04 and 03)
4. **13 + 14** — Preview UI and anti-slop validation (after 12 and 08)

---

## Human Checkpoints

The pipeline has **2 required human checkpoints**:

| Checkpoint | Plan | Purpose |
|------------|------|---------|
| Design Approval | 07 | Review business name, reference image, design tokens |
| Preview Approval | 13 | Review deployed preview before production |

---

## Key Files Created

After completing all plans, these files will exist:

```
src/
├── api/site-generator/
│   ├── index.ts           # API client
│   ├── presets.ts         # Category presets
│   ├── anti-slop.ts       # Validation
│   └── types.ts           # Interfaces
├── hooks/
│   └── useSiteGeneration.ts
├── components/nodes/WebDesignerNode/
│   ├── ReferencePreview.tsx
│   ├── DeployPreview.tsx
│   └── ProgressTracker.tsx
└── types/
    └── site-generation.ts

supabase/functions/
├── generate-identity/
├── generate-reference/
├── extract-design/
├── generate-content/
├── generate-hero/
├── generate-section/
├── refine-page/
├── assemble-nextjs/
├── push-to-github/
├── deploy-to-vercel/
└── promote-to-production/
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| First-pass approval rate | >60% |
| Anti-slop score | >85/100 |
| Time to preview | <5 min |
| Human interventions | <3 per site |

---

## Original Master Document

The original comprehensive plan is preserved at:
[../WEB_DESIGN_AGENT_PLAN.md](../WEB_DESIGN_AGENT_PLAN.md)

Use it as a reference for additional context, appendices, and detailed examples.
