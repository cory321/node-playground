# Plan 15: Frontend Orchestration

> **Purpose:** Implement the `useSiteGeneration` hook that orchestrates the entire pipeline and updates the WebDesignerNode UI.

**Dependencies:** All previous plans  
**Estimated Time:** 4-5 hours  
**Parallelizable With:** None

---

## Overview

The orchestration layer:
- Manages pipeline state machine
- Calls edge functions in sequence
- Handles human checkpoints
- Enables resume from any stage
- Updates UI with progress

---

## Subtasks

### State Interface

- [ ] **15.1** Define generation state in `src/hooks/useSiteGeneration.ts`

```typescript
export interface GenerationState {
  stage: GenerationStage;
  progress: number;  // 0-100
  
  // Phase 1
  identity?: BusinessIdentity;
  referenceImageUrl?: string;
  designTokens?: ExtractedDesignTokens;
  contentStrategy?: ContentStrategy;
  
  // Phase 2
  heroHtml?: string;
  sectionsHtml?: SectionOutput[];
  refinedHtml?: string;
  assembledFiles?: Record<string, string>;
  
  // Phase 3
  githubUrl?: string;
  previewUrl?: string;
  deploymentId?: string;
  productionUrl?: string;
  
  // Error
  error?: string;
  canRetry?: boolean;
}
```

### Main Hook

- [ ] **15.2** Create the orchestration hook

```typescript
export function useSiteGeneration(projectId: string) {
  const [state, setState] = useState<GenerationState>({ stage: 'idle', progress: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Resume from database on mount
  useEffect(() => {
    loadExistingJob();
  }, [projectId]);

  async function loadExistingJob() {
    const job = await getLatestJob(projectId);
    if (job && job.status !== 'complete') {
      setState(mapJobToState(job));
    }
  }

  async function startGeneration(input: GenerationInput) {
    setIsLoading(true);
    try {
      // Create job
      const job = await createJob(projectId, input);
      
      // Phase 1: Prepare
      await runPhase1(job.id, input);
      
      // Wait for human approval at design checkpoint
      setState(s => ({ ...s, stage: 'awaiting-design-approval' }));
    } catch (error) {
      setState(s => ({ ...s, stage: 'error', error: String(error) }));
    } finally {
      setIsLoading(false);
    }
  }

  async function approveDesign() {
    setIsLoading(true);
    try {
      await runPhase2(state);
      await runPhase3(state);
      setState(s => ({ ...s, stage: 'awaiting-preview-approval' }));
    } catch (error) {
      setState(s => ({ ...s, stage: 'error', error: String(error) }));
    } finally {
      setIsLoading(false);
    }
  }

  async function approvePreview() {
    setIsLoading(true);
    try {
      const result = await promoteToProduction(state.deploymentId!);
      setState(s => ({ ...s, stage: 'complete', productionUrl: result.productionUrl }));
    } catch (error) {
      setState(s => ({ ...s, stage: 'error', error: String(error) }));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    state,
    isLoading,
    startGeneration,
    approveDesign,
    approvePreview,
    regenerateImage: () => { /* ... */ },
    regenerateIdentity: () => { /* ... */ },
  };
}
```

### Phase Runners

- [ ] **15.3** Implement Phase 1 runner

```typescript
async function runPhase1(jobId: string, input: GenerationInput) {
  // 1.1 Identity
  setState(s => ({ ...s, stage: 'generating-identity', progress: 10 }));
  const identity = await generateIdentity(jobId, input);
  setState(s => ({ ...s, identity, progress: 25 }));

  // 1.2a Reference Image
  setState(s => ({ ...s, stage: 'generating-reference-image', progress: 30 }));
  const ref = await generateReference({ jobId, category: input.category });
  setState(s => ({ ...s, referenceImageUrl: ref.imageUrl, progress: 50 }));

  // 1.2b Extract Tokens
  setState(s => ({ ...s, stage: 'extracting-design-tokens', progress: 55 }));
  const tokens = await extractDesignTokens({ jobId, imageUrl: ref.imageUrl });
  setState(s => ({ ...s, designTokens: tokens, progress: 65 }));

  // 1.3 Content
  setState(s => ({ ...s, stage: 'generating-content', progress: 70 }));
  const content = await generateContent(jobId, identity, input.location, input.category);
  setState(s => ({ ...s, contentStrategy: content, progress: 80 }));
}
```

- [ ] **15.4** Implement Phase 2 runner

```typescript
async function runPhase2(state: GenerationState) {
  const { identity, designTokens, contentStrategy, referenceImageUrl } = state;
  
  // 2.1 Hero
  setState(s => ({ ...s, stage: 'generating-hero', progress: 30 }));
  const hero = await generateHero({ identity, designTokens, content: contentStrategy, referenceImageUrl });
  setState(s => ({ ...s, heroHtml: hero, progress: 45 }));

  // 2.2 Sections
  setState(s => ({ ...s, stage: 'generating-sections', progress: 50 }));
  const sections = await generateAllSections(/* ... */);
  setState(s => ({ ...s, sectionsHtml: sections, progress: 75 }));

  // 2.3 Refine
  setState(s => ({ ...s, stage: 'refining', progress: 80 }));
  const refined = await refinePage(/* ... */);
  setState(s => ({ ...s, refinedHtml: refined, progress: 85 }));

  // 2.4 Assemble
  setState(s => ({ ...s, stage: 'assembling', progress: 90 }));
  const files = await assembleProject(/* ... */);
  setState(s => ({ ...s, assembledFiles: files, progress: 95 }));
}
```

- [ ] **15.5** Implement Phase 3 runner

```typescript
async function runPhase3(state: GenerationState) {
  // 3.1 GitHub
  setState(s => ({ ...s, stage: 'pushing-to-github', progress: 30 }));
  const github = await pushToGitHub(state.identity.name, state.assembledFiles);
  setState(s => ({ ...s, githubUrl: github.repoUrl, progress: 60 }));

  // 3.2 Vercel
  setState(s => ({ ...s, stage: 'deploying-preview', progress: 70 }));
  const vercel = await deployToVercel(github.repoUrl);
  setState(s => ({ ...s, previewUrl: vercel.previewUrl, deploymentId: vercel.deploymentId, progress: 100 }));
}
```

### Progress Tracker UI

- [ ] **15.6** Create progress tracker component

```tsx
export function ProgressTracker({ state }: { state: GenerationState }) {
  const stages = [
    { key: 'identity', label: 'Identity', phases: ['generating-identity'] },
    { key: 'design', label: 'Design', phases: ['generating-reference-image', 'extracting-design-tokens'] },
    { key: 'content', label: 'Content', phases: ['generating-content'] },
    { key: 'hero', label: 'Hero', phases: ['generating-hero'] },
    { key: 'sections', label: 'Sections', phases: ['generating-sections'] },
    { key: 'deploy', label: 'Deploy', phases: ['pushing-to-github', 'deploying-preview'] },
  ];

  return (
    <div className="flex items-center gap-2">
      {stages.map(({ key, label, phases }) => {
        const isComplete = phases.every(p => isStageComplete(state.stage, p));
        const isCurrent = phases.includes(state.stage);
        
        return (
          <div key={key} className={`flex items-center gap-1 ${
            isComplete ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
          }`}>
            {isComplete ? '✅' : isCurrent ? '🔄' : '○'} {label}
          </div>
        );
      })}
    </div>
  );
}
```

### WebDesignerNode Integration

- [ ] **15.7** Update WebDesignerNode to use orchestration hook

```tsx
export function WebDesignerNode({ data }: NodeProps) {
  const {
    state,
    isLoading,
    startGeneration,
    approveDesign,
    approvePreview,
    regenerateImage,
  } = useSiteGeneration(data.projectId);

  return (
    <BaseNode>
      <ProgressTracker state={state} />
      
      {state.stage === 'idle' && (
        <StartButton onClick={() => startGeneration(data.input)} />
      )}
      
      {state.stage === 'awaiting-design-approval' && (
        <ReferencePreview
          identity={state.identity!}
          referenceImage={{ imageUrl: state.referenceImageUrl! }}
          designTokens={state.designTokens!}
          onApprove={approveDesign}
          onRegenerate={regenerateImage}
        />
      )}
      
      {state.stage === 'awaiting-preview-approval' && (
        <DeployPreview
          previewUrl={state.previewUrl!}
          onApprove={approvePreview}
        />
      )}
      
      {state.stage === 'complete' && (
        <CompletionDisplay productionUrl={state.productionUrl} />
      )}
      
      {state.stage === 'error' && (
        <ErrorDisplay error={state.error} />
      )}
    </BaseNode>
  );
}
```

### Resume Logic

- [ ] **15.8** Implement job resume from database

```typescript
function mapJobToState(job: SiteGenerationJob): GenerationState {
  return {
    stage: job.status as GenerationStage,
    progress: calculateProgress(job.status),
    identity: job.identity_json,
    referenceImageUrl: job.reference_image_url,
    designTokens: job.design_tokens,
    contentStrategy: job.content_strategy,
    heroHtml: job.hero_html,
    sectionsHtml: job.sections_json,
    githubUrl: job.github_repo_url,
    previewUrl: job.preview_url,
    deploymentId: job.deployment_id,
    productionUrl: job.production_url,
    error: job.error_message,
  };
}
```

### Testing

- [ ] **15.9** Create hook tests

```typescript
describe('useSiteGeneration', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useSiteGeneration('test-project'));
    expect(result.current.state.stage).toBe('idle');
  });

  it('progresses through phases', async () => {
    const { result } = renderHook(() => useSiteGeneration('test-project'));
    await act(() => result.current.startGeneration(mockInput));
    expect(result.current.state.stage).toBe('awaiting-design-approval');
  });
});
```

---

## Verification Checklist

- [ ] Hook manages state correctly
- [ ] Phase transitions work
- [ ] Human checkpoints pause correctly
- [ ] Resume from database works
- [ ] Progress UI updates smoothly
- [ ] Errors are handled gracefully

---

## Complete Pipeline Flow

```
idle → generating-identity → generating-reference-image → extracting-design-tokens
  → generating-content → 🔴 awaiting-design-approval
  → generating-hero → generating-sections → refining → assembling
  → pushing-to-github → deploying-preview → 🔴 awaiting-preview-approval
  → deploying-production → complete
```

---

## Final Checklist

After completing all 15 plans:
- [ ] Full pipeline executes end-to-end
- [ ] Human checkpoints work correctly
- [ ] Resume from any stage works
- [ ] Anti-slop validation prevents bad output
- [ ] Sites deploy to production successfully
