# Web Design Agent: Architecture Overview

> **Purpose:** Reference document providing the high-level architecture and dependencies for all implementation plans. Read this first before executing any other plan.

---

## System Overview

This multi-step web design agent generates beautiful, SEO-optimized websites through an image-first workflow with strategic human checkpoints.

### Core Principles

1. **Image-First Design**: Generate a visual reference using AI, then extract the design system from it
2. **Structure-Only Prompts**: Image generation specifies sections and layout, NOT colors
3. **Visual References > Text Descriptions**: AI-generated screenshots beat verbal style descriptions
4. **Explicit Anti-Slop Constraints**: Every prompt includes "NEVER DO" lists
5. **Human Approval at Value Inflection Points**: Automate execution, require human approval for compounding decisions
6. **Supabase Edge Functions Backend**: Persist job state, secure API keys, enable resume-from-checkpoint

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HYBRID ARCHITECTURE                              │
│                                                                     │
│  Frontend (React)                                                  │
│  ├── Orchestrates flow (calls edge functions in sequence)          │
│  ├── Handles human checkpoints (UI for approval)                   │
│  ├── Displays progress/previews                                    │
│  └── Can disconnect between checkpoints safely                     │
│                                                                     │
│  Supabase Edge Functions                                           │
│  ├── /generate-identity     → Returns identity JSON                │
│  ├── /generate-reference    → Calls Gemini Image, returns URL      │
│  ├── /extract-design        → Analyzes image, returns tokens       │
│  ├── /generate-content      → Returns content strategy             │
│  ├── /generate-hero         → Returns hero HTML/CSS                │
│  ├── /generate-section      → Returns section HTML/CSS             │
│  ├── /assemble-nextjs       → Returns complete project files       │
│  ├── /push-to-github        → Creates repo, returns URL            │
│  └── /deploy-to-vercel      → Deploys, returns preview URL         │
│                                                                     │
│  Supabase Tables                                                   │
│  └── site_generations                                              │
│      ├── id, project_id, status                                    │
│      ├── identity_json, design_tokens, reference_image_url         │
│      ├── hero_html, sections_json                                  │
│      └── github_url, preview_url, production_url                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Pipeline Stages

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PHASE 1   │    │   PHASE 2   │    │   PHASE 3   │
│   PREPARE   │───▶│   BUILD     │───▶│   DEPLOY    │
└─────────────┘    └─────────────┘    └─────────────┘

Phase 1: Prepare
├── 1.1 Generate Business Identity
├── 1.2a Generate Reference Screenshot (Gemini Image)
├── 1.2b Extract Design Tokens from Screenshot
├── 1.3 Generate Content Strategy
└── 🔴 HUMAN CHECKPOINT: Approve name + reference image

Phase 2: Build
├── 2.1 Generate Hero Section (matching reference)
├── 2.2 Generate Remaining Sections
├── 2.3 Refinement Pass
└── 2.4 Assemble Next.js Project

Phase 3: Deploy
├── 3.1 Push to GitHub
├── 3.2 Deploy to Vercel Preview
├── 🔴 HUMAN CHECKPOINT: Approve preview
└── 3.3 Promote to Production
```

---

## Implementation Plans Index

Execute these plans in order. Some can be parallelized where noted.

| Plan | Name                        | Dependencies   | Can Parallelize With |
| ---- | --------------------------- | -------------- | -------------------- |
| 01   | Infrastructure Setup        | None           | —                    |
| 02   | Category Presets Module     | 01             | 03, 04               |
| 03   | Identity Generation Service | 01             | 02, 04               |
| 04   | Reference Image Generation  | 01, 02         | 03                   |
| 05   | Design Token Extraction     | 01, 04         | 06                   |
| 06   | Content Strategy Service    | 01, 03         | 05                   |
| 07   | Design Approval UI          | 03, 04, 05, 06 | —                    |
| 08   | Hero Section Generation     | 05, 06         | 09                   |
| 09   | Section Generation System   | 05, 06, 08     | —                    |
| 10   | Refinement & Assembly       | 08, 09         | —                    |
| 11   | GitHub Integration          | 10             | 12                   |
| 12   | Vercel Deployment           | 11             | —                    |
| 13   | Preview Approval UI         | 12             | 14                   |
| 14   | Anti-Slop Validation        | 08             | 13                   |
| 15   | Frontend Orchestration      | All above      | —                    |
| 16   | Node Architecture           | All above      | —                    |

---

## State Machine

```typescript
type GenerationStage =
	| 'idle'
	| 'generating-identity'
	| 'generating-reference-image'
	| 'extracting-design-tokens'
	| 'generating-content'
	| 'awaiting-design-approval' // 🔴 Human checkpoint
	| 'generating-hero'
	| 'generating-sections'
	| 'refining'
	| 'assembling'
	| 'pushing-to-github'
	| 'deploying-preview'
	| 'awaiting-preview-approval' // 🔴 Human checkpoint
	| 'deploying-production'
	| 'complete'
	| 'error';
```

---

## Success Metrics

| Metric                   | Target  | Measurement                         |
| ------------------------ | ------- | ----------------------------------- |
| First-pass approval rate | >60%    | % previews approved without changes |
| Slop score               | >85/100 | Automated anti-slop validation      |
| Time to preview          | <5 min  | Start to Vercel preview URL         |
| Human interventions      | <3      | Checkpoints hit per site            |

---

## File Structure (Target)

```
src/
├── api/
│   └── site-generator/
│       ├── index.ts              # Client for calling edge functions
│       ├── presets.ts            # Category presets for image prompts
│       └── types.ts              # All interfaces
├── hooks/
│   └── useSiteGeneration.ts      # Full workflow orchestration + state
├── components/nodes/
│   └── WebDesignerNode/
│       ├── WebDesignerNode.tsx   # Enhanced with multi-step UI
│       ├── ReferencePreview.tsx  # Checkpoint 1: Image + identity review
│       ├── DeployPreview.tsx     # Checkpoint 2: Preview approval
│       ├── ProgressTracker.tsx   # Pipeline status display
│       └── DomainSelector.tsx    # Domain suggestions UI
└── types/
    └── site-generation.ts        # All new interfaces

supabase/
└── functions/
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

## Human Checkpoints Summary

| Checkpoint            | Why Human?                       | Risk if Automated              |
| --------------------- | -------------------------------- | ------------------------------ |
| **Business Name**     | Brand/legal, domain availability | Bad name propagates everywhere |
| **Design Direction**  | Taste, brand fit                 | Subjective quality issues      |
| **Preview Approval**  | Full quality check               | Bad site goes live             |
| **Production Deploy** | Financial commitment             | Wasted hosting/domain costs    |

---

## Next Steps

1. Read this overview completely
2. Start with **Plan 01: Infrastructure Setup**
3. Follow dependency order in the index above
4. Reference this document when you need architectural context
