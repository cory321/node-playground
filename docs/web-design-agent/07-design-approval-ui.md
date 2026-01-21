# Plan 07: Design Approval UI

> **Purpose:** Build the first human checkpoint UI where users review and approve the business identity, reference image, and design tokens before code generation begins.

**Dependencies:** Plans 03, 04, 05, 06  
**Estimated Time:** 3-4 hours  
**Parallelizable With:** None

---

## Overview

This UI component displays:
- Business name and tagline
- Domain suggestions with availability hints
- Generated reference screenshot
- Extracted color palette
- Typography preview
- Vibe keywords
- Regeneration controls

---

## Subtasks

### Component Structure

- [ ] **7.1** Create `src/components/nodes/WebDesignerNode/ReferencePreview.tsx`

```tsx
import React from 'react';
import type { BusinessIdentity, ExtractedDesignTokens, ReferenceImageResult } from '../../../types/site-generation';

interface ReferencePreviewProps {
  identity: BusinessIdentity;
  referenceImage: ReferenceImageResult;
  designTokens: ExtractedDesignTokens;
  onApprove: () => void;
  onRegenerate: (what: 'identity' | 'image' | 'all') => void;
  isLoading?: boolean;
}

export function ReferencePreview({
  identity,
  referenceImage,
  designTokens,
  onApprove,
  onRegenerate,
  isLoading,
}: ReferencePreviewProps) {
  return (
    <div className="space-y-6 p-4">
      <h2 className="text-lg font-semibold">Review Design Direction</h2>
      
      {/* Identity Section */}
      <IdentityDisplay identity={identity} />
      
      {/* Reference Image */}
      <ImagePreview 
        imageUrl={referenceImage.imageUrl}
        onRegenerate={() => onRegenerate('image')}
      />
      
      {/* Design Tokens */}
      <DesignTokensDisplay tokens={designTokens} />
      
      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={() => onRegenerate('all')}
          disabled={isLoading}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          🔄 Regenerate All
        </button>
        <button
          onClick={onApprove}
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          ✅ Approve & Continue
        </button>
      </div>
    </div>
  );
}
```

### Identity Display

- [ ] **7.2** Create identity display component

```tsx
interface IdentityDisplayProps {
  identity: BusinessIdentity;
}

function IdentityDisplay({ identity }: IdentityDisplayProps) {
  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
      <div>
        <span className="text-sm text-gray-500">Business Name</span>
        <h3 className="text-xl font-bold">{identity.name}</h3>
      </div>
      
      <div>
        <span className="text-sm text-gray-500">Tagline</span>
        <p className="text-gray-700 italic">"{identity.tagline}"</p>
      </div>
      
      <div>
        <span className="text-sm text-gray-500">Domain Suggestions</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {identity.domainSuggestions.map((domain, i) => (
            <span 
              key={domain}
              className={`px-2 py-1 text-sm rounded ${
                i === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {domain}
            </span>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div>
          <span className="text-sm text-gray-500">Owner</span>
          <p className="font-medium">{identity.ownerStory.name}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Years in Business</span>
          <p className="font-medium">{identity.yearsInBusiness}</p>
        </div>
      </div>
    </div>
  );
}
```

### Image Preview

- [ ] **7.3** Create image preview component

```tsx
interface ImagePreviewProps {
  imageUrl: string;
  onRegenerate: () => void;
}

function ImagePreview({ imageUrl, onRegenerate }: ImagePreviewProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Reference Screenshot</span>
        <button
          onClick={onRegenerate}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          🔄 Regenerate
        </button>
      </div>
      
      <div 
        className={`relative overflow-hidden rounded-lg border cursor-pointer ${
          isExpanded ? 'max-h-none' : 'max-h-96'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <img 
          src={imageUrl} 
          alt="Generated website reference"
          className="w-full"
        />
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        {isExpanded ? 'Click to collapse' : 'Click to expand full image'}
      </p>
    </div>
  );
}
```

### Color Palette Display

- [ ] **7.4** Create color palette component

```tsx
interface ColorSwatchProps {
  color: string;
  label: string;
}

function ColorSwatch({ color, label }: ColorSwatchProps) {
  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-8 h-8 rounded border shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xs font-mono">{color}</p>
      </div>
    </div>
  );
}

function ColorPaletteDisplay({ colors }: { colors: ColorPalette }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <ColorSwatch color={colors.primary} label="Primary" />
      <ColorSwatch color={colors.secondary} label="Secondary" />
      <ColorSwatch color={colors.accent} label="Accent" />
      <ColorSwatch color={colors.background} label="Background" />
      <ColorSwatch color={colors.surface} label="Surface" />
      <ColorSwatch color={colors.surfaceAlt} label="Surface Alt" />
      <ColorSwatch color={colors.text} label="Text" />
      <ColorSwatch color={colors.textMuted} label="Text Muted" />
    </div>
  );
}
```

### Typography Preview

- [ ] **7.5** Create typography preview component

```tsx
function TypographyPreview({ typography }: { typography: TypographyTokens }) {
  // Dynamically load fonts
  React.useEffect(() => {
    if (typography.googleFontsImport) {
      const link = document.createElement('link');
      link.href = typography.googleFontsImport.replace("@import url('", '').replace("');", '');
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [typography.googleFontsImport]);
  
  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-medium text-gray-500">Typography</h4>
      
      <div 
        style={{ fontFamily: `'${typography.headlineFont}', serif` }}
        className="text-2xl font-bold"
      >
        {typography.headlineFont}
      </div>
      
      <div 
        style={{ fontFamily: `'${typography.bodyFont}', sans-serif` }}
        className="text-base"
      >
        {typography.bodyFont} - The quick brown fox jumps over the lazy dog.
      </div>
    </div>
  );
}
```

### Design Tokens Display

- [ ] **7.6** Create combined design tokens display

```tsx
function DesignTokensDisplay({ tokens }: { tokens: ExtractedDesignTokens }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Color Palette</h4>
        <ColorPaletteDisplay colors={tokens.colors} />
      </div>
      
      <TypographyPreview typography={tokens.typography} />
      
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500">Vibe:</span>
        {tokens.vibe.map(keyword => (
          <span 
            key={keyword}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### Loading States

- [ ] **7.7** Add loading state components

```tsx
function ReferencePreviewSkeleton() {
  return (
    <div className="space-y-6 p-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48" />
      
      <div className="space-y-3 p-4 bg-gray-100 rounded-lg">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="h-6 bg-gray-200 rounded w-28" />
        </div>
      </div>
      
      <div className="h-96 bg-gray-200 rounded-lg" />
      
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}
```

### Error States

- [ ] **7.8** Add error handling UI

```tsx
interface ErrorDisplayProps {
  error: Error;
  onRetry: () => void;
}

function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h4 className="font-medium text-red-800">Generation Failed</h4>
      <p className="text-sm text-red-600 mt-1">{error.message}</p>
      <button
        onClick={onRetry}
        className="mt-3 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
      >
        Try Again
      </button>
    </div>
  );
}
```

### Integration with WebDesignerNode

- [ ] **7.9** Update `WebDesignerNode.tsx` to include checkpoint

```tsx
// In WebDesignerNode.tsx
import { ReferencePreview, ReferencePreviewSkeleton } from './ReferencePreview';

// In the render, when stage is 'awaiting-design-approval':
{state.stage === 'awaiting-design-approval' && state.identity && state.referenceImageUrl && state.designTokens && (
  <ReferencePreview
    identity={state.identity}
    referenceImage={{ imageUrl: state.referenceImageUrl, prompt: '', generatedAt: '', dimensions: { width: 1440, height: 4800 } }}
    designTokens={state.designTokens}
    onApprove={approveDesign}
    onRegenerate={handleRegenerate}
    isLoading={isLoading}
  />
)}
```

### Export Module

- [ ] **7.10** Create index export

```typescript
// src/components/nodes/WebDesignerNode/index.ts
export { ReferencePreview, ReferencePreviewSkeleton } from './ReferencePreview';
export { DesignTokensDisplay } from './DesignTokensDisplay';
```

---

## Verification Checklist

- [ ] Identity displays correctly with all fields
- [ ] Reference image loads and can be expanded
- [ ] Color swatches render correct colors
- [ ] Fonts load dynamically from Google Fonts
- [ ] Regenerate buttons trigger correct actions
- [ ] Approve button advances the pipeline
- [ ] Loading skeleton displays during generation
- [ ] Errors display with retry option

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📋 Review Design Direction                                         │
├─────────────────────────────────────────────────────────────────────┤
│ Business Name: Phoenix Plumbing Pros                               │
│ Domain: phoenixplumbingpros.com ✅                                 │
│ Tagline: "Phoenix's Trusted Emergency Plumbers — 24/7 Response"   │
│                                                                     │
│ ┌─ Reference Screenshot ────────────────────────────────────────┐   │
│ │ [Full-page website mockup - click to expand]                  │   │
│ │ [🔄 Regenerate Image]                                         │   │
│ └───────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ Color Palette:                                                     │
│ ██ Primary  ██ Secondary  ██ Accent  ██ Background                │
│ #1E3A5F    #F5A623       #E55934    #FAFAF8                       │
│                                                                     │
│ Typography: DM Serif Display + Plus Jakarta Sans                   │
│ Vibe: [Bold] [Professional] [Urgent] [Trustworthy]                │
│                                                                     │
│ [🔄 Regenerate All]  [✅ Approve & Continue]                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

After completing this plan:
1. Proceed to **Plan 08: Hero Section Generation**
2. Approval advances state to `generating-hero`
