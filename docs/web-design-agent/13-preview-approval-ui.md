# Plan 13: Preview Approval UI

> **Purpose:** Build the second human checkpoint UI for reviewing the deployed preview before production promotion.

**Dependencies:** Plan 12 (Vercel)  
**Estimated Time:** 2-3 hours  
**Parallelizable With:** Plan 14

---

## Overview

This UI component displays:
- Embedded preview iframe
- Mobile/desktop viewport toggle
- Quality checklist
- Change request flow
- Approval/rejection actions

---

## Subtasks

### Component Structure

- [ ] **13.1** Create `src/components/nodes/WebDesignerNode/DeployPreview.tsx`

```tsx
import React from 'react';

interface DeployPreviewProps {
  previewUrl: string;
  onApprove: () => void;
  onRequestChanges: (feedback: string) => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function DeployPreview({
  previewUrl,
  onApprove,
  onRequestChanges,
  onReject,
  isLoading,
}: DeployPreviewProps) {
  const [viewport, setViewport] = React.useState<'desktop' | 'mobile'>('desktop');
  const [showChangeForm, setShowChangeForm] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Preview Deployment</h2>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          🔗 Open in New Tab
        </a>
      </div>

      {/* Viewport Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewport('desktop')}
          className={`px-3 py-1 text-sm rounded ${
            viewport === 'desktop' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
          }`}
        >
          💻 Desktop
        </button>
        <button
          onClick={() => setViewport('mobile')}
          className={`px-3 py-1 text-sm rounded ${
            viewport === 'mobile' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
          }`}
        >
          📱 Mobile
        </button>
      </div>

      {/* Preview Frame */}
      <div className="border rounded-lg overflow-hidden bg-gray-100">
        <iframe
          src={previewUrl}
          className={`bg-white transition-all duration-300 ${
            viewport === 'mobile' ? 'w-[375px] h-[667px] mx-auto' : 'w-full h-[600px]'
          }`}
          title="Website Preview"
        />
      </div>

      {/* Quality Checklist */}
      <QualityChecklist />

      {/* Change Request Form */}
      {showChangeForm && (
        <ChangeRequestForm
          feedback={feedback}
          setFeedback={setFeedback}
          onSubmit={() => {
            onRequestChanges(feedback);
            setShowChangeForm(false);
          }}
          onCancel={() => setShowChangeForm(false)}
        />
      )}

      {/* Actions */}
      {!showChangeForm && (
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => setShowChangeForm(true)}
            disabled={isLoading}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            🔄 Request Changes
          </button>
          <button
            onClick={onReject}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            ❌ Reject
          </button>
          <button
            onClick={onApprove}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ✅ Approve for Production
          </button>
        </div>
      )}
    </div>
  );
}
```

### Quality Checklist

- [ ] **13.2** Create quality checklist component

```tsx
function QualityChecklist() {
  const [checks, setChecks] = React.useState({
    looksReal: false,
    phoneClickable: false,
    formWorks: false,
    loadsFast: false,
    wouldCall: false,
  });

  const allChecked = Object.values(checks).every(Boolean);

  return (
    <div className={`p-4 rounded-lg ${allChecked ? 'bg-green-50' : 'bg-gray-50'}`}>
      <h3 className="font-medium mb-3">Quality Checklist</h3>
      <div className="space-y-2">
        {[
          { key: 'looksReal', label: 'Does it look like a real local business?' },
          { key: 'phoneClickable', label: 'Is the phone number clickable?' },
          { key: 'formWorks', label: 'Does the contact form work?' },
          { key: 'loadsFast', label: 'Does it load fast?' },
          { key: 'wouldCall', label: 'Would YOU call this number?' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checks[key as keyof typeof checks]}
              onChange={(e) => setChecks({ ...checks, [key]: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
      {allChecked && (
        <p className="text-sm text-green-600 mt-2">✅ All checks passed!</p>
      )}
    </div>
  );
}
```

### Change Request Form

- [ ] **13.3** Create change request form

```tsx
interface ChangeRequestFormProps {
  feedback: string;
  setFeedback: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function ChangeRequestForm({ feedback, setFeedback, onSubmit, onCancel }: ChangeRequestFormProps) {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-medium mb-2">📝 Request Changes</h3>
      <p className="text-sm text-gray-600 mb-3">
        Describe what needs to change. Be specific about which section and what adjustment.
      </p>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="The hero text is too small on mobile. Make the headline larger and add more contrast to the CTA button."
        className="w-full h-24 p-3 border rounded-lg text-sm"
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm border rounded"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!feedback.trim()}
          className="px-3 py-1 text-sm bg-yellow-600 text-white rounded disabled:opacity-50"
        >
          Submit → Regenerate
        </button>
      </div>
    </div>
  );
}
```

### Loading States

- [ ] **13.4** Add deployment loading states

```tsx
interface DeploymentLoadingProps {
  stage: 'building' | 'deploying' | 'waiting';
}

export function DeploymentLoading({ stage }: DeploymentLoadingProps) {
  const messages = {
    building: 'Building your website...',
    deploying: 'Deploying to Vercel...',
    waiting: 'Waiting for preview URL...',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      <p className="mt-4 text-gray-600">{messages[stage]}</p>
      <p className="text-sm text-gray-400 mt-1">This usually takes 30-90 seconds</p>
    </div>
  );
}
```

### Integration with WebDesignerNode

- [ ] **13.5** Update WebDesignerNode to include preview checkpoint

```tsx
// In WebDesignerNode.tsx
{state.stage === 'awaiting-preview-approval' && state.previewUrl && (
  <DeployPreview
    previewUrl={state.previewUrl}
    onApprove={approvePreview}
    onRequestChanges={handleChangeRequest}
    onReject={handleReject}
    isLoading={isLoading}
  />
)}

{state.stage === 'deploying-preview' && (
  <DeploymentLoading stage="deploying" />
)}
```

### Change Request Handler

- [ ] **13.6** Implement change request flow

```typescript
async function handleChangeRequest(feedback: string) {
  // Update job with feedback
  await supabase
    .from('site_generations')
    .update({
      status: 'refining',
      error_message: feedback,  // Store feedback for refinement
    })
    .eq('id', jobId);
  
  // Trigger refinement with feedback
  const refined = await refinePage(
    jobId,
    state.heroHtml!,
    state.sectionsHtml!,
    state.designTokens!,
    state.contentStrategy!,
    feedback  // Pass feedback as refinement instruction
  );
  
  // Re-assemble and re-deploy
  // ...
}
```

### Testing

- [ ] **13.7** Create component tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DeployPreview } from './DeployPreview';

describe('DeployPreview', () => {
  it('renders preview iframe', () => {
    render(
      <DeployPreview
        previewUrl="https://test.vercel.app"
        onApprove={() => {}}
        onRequestChanges={() => {}}
        onReject={() => {}}
      />
    );
    
    expect(screen.getByTitle('Website Preview')).toBeInTheDocument();
  });
  
  it('toggles viewport', () => {
    render(
      <DeployPreview
        previewUrl="https://test.vercel.app"
        onApprove={() => {}}
        onRequestChanges={() => {}}
        onReject={() => {}}
      />
    );
    
    fireEvent.click(screen.getByText('📱 Mobile'));
    // Check iframe width changed
  });
});
```

---

## Verification Checklist

- [ ] Preview iframe loads correctly
- [ ] Viewport toggle works
- [ ] Quality checklist tracks state
- [ ] Change request form submits feedback
- [ ] Approval advances to production
- [ ] Rejection cancels the job

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🌐 Preview Deployment Ready                [🔗 Open in New Tab]    │
├─────────────────────────────────────────────────────────────────────┤
│ [💻 Desktop] [📱 Mobile]                                           │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │                                                             │   │
│ │                   [Embedded iframe]                         │   │
│ │                                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ Quality Checklist:                                                 │
│ ├── [✓] Does it look like a real local business?                  │
│ ├── [✓] Is the phone number clickable?                            │
│ ├── [✓] Does the form work?                                       │
│ ├── [✓] Does it load fast?                                        │
│ └── [✓] Would YOU call this number?                               │
│                                                                     │
│ [🔄 Request Changes]  [❌ Reject]  [✅ Approve for Production]    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

After completing this plan:
1. Proceed to **Plan 14: Anti-Slop Validation**
2. Then **Plan 15: Frontend Orchestration**
