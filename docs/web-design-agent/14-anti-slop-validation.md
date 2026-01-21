# Plan 14: Anti-Slop Validation System

> **Purpose:** Implement comprehensive validation to detect and prevent "AI slop" aesthetics throughout the generation pipeline.

**Dependencies:** Plan 08 (Hero)  
**Estimated Time:** 2-3 hours  
**Parallelizable With:** Plan 13

---

## Overview

Anti-slop validation:
- Runs after each generation step
- Detects banned fonts, colors, layouts
- Assigns quality scores
- Can trigger regeneration if score too low

---

## Subtasks

### Banned Patterns Module

- [ ] **14.1** Create `src/api/site-generator/anti-slop.ts`

```typescript
// Banned fonts - overused AI defaults
export const BANNED_FONTS = [
  'inter', 'roboto', 'arial', 'space grotesk', 'open sans',
  'segoe ui', 'helvetica', 'system-ui',
];

// Banned color patterns (hex values)
export const BANNED_COLORS = [
  // Purple gradients
  '#8b5cf6', '#7c3aed', '#6366f1', '#a855f7', '#9333ea',
  // Blue-purple combo
  '#4f46e5', '#6d28d9',
];

// Banned CSS patterns
export const BANNED_CSS_PATTERNS = [
  /grid-cols-3.*card/i,           // 3-column card grids
  /carousel/i,                     // Carousels
  /trusted.?by.*logo/i,           // "Trusted by" logo bars
  /blob.*shape/i,                 // Floating blob shapes
];

// Banned copy phrases
export const BANNED_PHRASES = [
  'get 3 free quotes',
  'compare prices from',
  'we connect you with',
  'our network of',
  '100% satisfaction guaranteed',
  'limited time offer',
  'best in class',
  '#1 rated',
];
```

### Validation Function

- [ ] **14.2** Create main validation function

```typescript
export interface SlopCheckResult {
  passed: boolean;
  score: number;           // 0-100
  violations: Violation[];
  warnings: Warning[];
}

export interface Violation {
  type: 'font' | 'color' | 'layout' | 'copy' | 'icon';
  detail: string;
  severity: 'high' | 'medium';
  location?: string;
}

export interface Warning {
  type: string;
  detail: string;
  suggestion: string;
}

export function checkForSlop(html: string, css: string = ''): SlopCheckResult {
  const combined = (html + css).toLowerCase();
  const violations: Violation[] = [];
  const warnings: Warning[] = [];

  // Check fonts
  for (const font of BANNED_FONTS) {
    if (combined.includes(`"${font}"`) || combined.includes(`'${font}'`)) {
      violations.push({
        type: 'font',
        detail: `Banned font detected: ${font}`,
        severity: 'high',
      });
    }
  }

  // Check colors
  for (const color of BANNED_COLORS) {
    if (combined.includes(color.toLowerCase())) {
      violations.push({
        type: 'color',
        detail: `Banned color detected: ${color}`,
        severity: 'high',
      });
    }
  }
  
  // Check for purple (including variations)
  if (/purple|#[89ab][0-5][cdef][0-9a-f]{3}/i.test(combined)) {
    violations.push({
      type: 'color',
      detail: 'Purple color detected - likely AI slop',
      severity: 'high',
    });
  }

  // Check CSS patterns
  for (const pattern of BANNED_CSS_PATTERNS) {
    if (pattern.test(combined)) {
      violations.push({
        type: 'layout',
        detail: `Banned pattern: ${pattern.toString()}`,
        severity: 'medium',
      });
    }
  }

  // Check copy phrases
  for (const phrase of BANNED_PHRASES) {
    if (combined.includes(phrase.toLowerCase())) {
      violations.push({
        type: 'copy',
        detail: `Banned phrase: "${phrase}"`,
        severity: 'medium',
      });
    }
  }

  // Check for Lucide icons (overused)
  if (combined.includes('lucide')) {
    warnings.push({
      type: 'icon',
      detail: 'Lucide icons detected - very common in AI output',
      suggestion: 'Consider Heroicons, Phosphor, or custom SVGs',
    });
  }

  // Check for stock photo patterns
  if (combined.includes('gradient overlay') || combined.includes('stock photo')) {
    warnings.push({
      type: 'image',
      detail: 'Stock photo with gradient overlay pattern detected',
      suggestion: 'Use authentic imagery or solid backgrounds',
    });
  }

  // Calculate score
  const highViolations = violations.filter(v => v.severity === 'high').length;
  const mediumViolations = violations.filter(v => v.severity === 'medium').length;
  const score = Math.max(0, 100 - (highViolations * 25) - (mediumViolations * 10) - (warnings.length * 5));

  return {
    passed: highViolations === 0,
    score,
    violations,
    warnings,
  };
}
```

### Auto-Regeneration Logic

- [ ] **14.3** Create regeneration trigger

```typescript
export interface RegenerationDecision {
  shouldRegenerate: boolean;
  reason?: string;
  maxRetries: number;
}

export function shouldRegenerate(
  result: SlopCheckResult,
  currentAttempt: number,
  maxAttempts: number = 3
): RegenerationDecision {
  if (currentAttempt >= maxAttempts) {
    return {
      shouldRegenerate: false,
      reason: 'Max regeneration attempts reached',
      maxRetries: maxAttempts,
    };
  }

  if (result.score < 50) {
    return {
      shouldRegenerate: true,
      reason: `Score too low (${result.score}/100): ${result.violations[0]?.detail}`,
      maxRetries: maxAttempts,
    };
  }

  const criticalViolations = result.violations.filter(v => 
    v.type === 'font' || v.type === 'color'
  );

  if (criticalViolations.length > 0) {
    return {
      shouldRegenerate: true,
      reason: `Critical violation: ${criticalViolations[0].detail}`,
      maxRetries: maxAttempts,
    };
  }

  return {
    shouldRegenerate: false,
    maxRetries: maxAttempts,
  };
}
```

### Validation in Pipeline

- [ ] **14.4** Integrate validation into generation flow

```typescript
export async function generateWithValidation<T>(
  generateFn: () => Promise<T>,
  extractHtml: (result: T) => string,
  sectionName: string,
  maxAttempts: number = 3
): Promise<{ result: T; slopCheck: SlopCheckResult }> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await generateFn();
    const html = extractHtml(result);
    const slopCheck = checkForSlop(html);
    
    console.log(`${sectionName} attempt ${attempt}: Score ${slopCheck.score}/100`);
    
    if (slopCheck.passed || attempt === maxAttempts) {
      return { result, slopCheck };
    }
    
    console.warn(`Regenerating ${sectionName} due to slop:`, slopCheck.violations);
  }
  
  throw new Error(`Failed to generate ${sectionName} without slop after ${maxAttempts} attempts`);
}
```

### Score Display Component

- [ ] **14.5** Create score display component

```tsx
interface SlopScoreProps {
  score: number;
  violations?: Violation[];
  warnings?: Warning[];
  showDetails?: boolean;
}

export function SlopScore({ score, violations = [], warnings = [], showDetails }: SlopScoreProps) {
  const getColor = () => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getEmoji = () => {
    if (score >= 85) return '✨';
    if (score >= 60) return '⚠️';
    return '❌';
  };

  return (
    <div className={`px-3 py-1 rounded-lg ${getColor()}`}>
      <span className="font-medium">{getEmoji()} {score}/100</span>
      
      {showDetails && violations.length > 0 && (
        <ul className="mt-2 text-sm space-y-1">
          {violations.map((v, i) => (
            <li key={i} className="text-red-700">• {v.detail}</li>
          ))}
        </ul>
      )}
      
      {showDetails && warnings.length > 0 && (
        <ul className="mt-2 text-sm space-y-1">
          {warnings.map((w, i) => (
            <li key={i} className="text-yellow-700">• {w.detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Prompt Enhancement

- [ ] **14.6** Create slop-aware prompt enhancer

```typescript
export function enhancePromptWithAntiSlop(basePrompt: string): string {
  return `${basePrompt}

${ANTI_SLOP_BLOCK}

<quality_emphasis>
Your output will be scored for uniqueness. Avoid common AI patterns:
- Score penalty for: Inter, Roboto, purple gradients, 3-column cards
- Score bonus for: Distinctive fonts, unique color schemes, asymmetric layouts
Target score: 85+/100
</quality_emphasis>`;
}

export const ANTI_SLOP_BLOCK = `<anti_slop_requirements>
TYPOGRAPHY — NEVER USE:
${BANNED_FONTS.map(f => `- ${f}`).join('\n')}

COLORS — NEVER USE:
- Purple gradients or purple as primary/accent
- Blue-purple combinations
- Any color from: ${BANNED_COLORS.join(', ')}

LAYOUT — NEVER CREATE:
- 3-column card grids with identical styling
- Centered Bootstrap-style layouts
- "Trusted by" grayscale logo bars
- Testimonial carousels
- Floating geometric blob shapes

COPY — NEVER WRITE:
${BANNED_PHRASES.map(p => `- "${p}"`).join('\n')}
</anti_slop_requirements>`;
```

### Testing

- [ ] **14.7** Create comprehensive tests

```typescript
describe('Anti-Slop Validation', () => {
  describe('checkForSlop', () => {
    it('detects banned fonts', () => {
      const result = checkForSlop('<div style="font-family: Inter">');
      expect(result.passed).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({ type: 'font', detail: expect.stringContaining('inter') })
      );
    });

    it('detects purple colors', () => {
      const result = checkForSlop('<div style="color: #8B5CF6">');
      expect(result.passed).toBe(false);
    });

    it('passes clean HTML', () => {
      const result = checkForSlop('<div style="font-family: DM Serif Display; color: #1E3A5F">');
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(80);
    });

    it('detects banned phrases', () => {
      const result = checkForSlop('<p>Get 3 Free Quotes Today!</p>');
      expect(result.violations).toContainEqual(
        expect.objectContaining({ type: 'copy' })
      );
    });
  });

  describe('shouldRegenerate', () => {
    it('triggers on low score', () => {
      const result = { passed: false, score: 40, violations: [], warnings: [] };
      expect(shouldRegenerate(result, 1).shouldRegenerate).toBe(true);
    });

    it('stops after max attempts', () => {
      const result = { passed: false, score: 40, violations: [], warnings: [] };
      expect(shouldRegenerate(result, 3, 3).shouldRegenerate).toBe(false);
    });
  });
});
```

---

## Verification Checklist

- [ ] Detects all banned fonts
- [ ] Detects purple colors
- [ ] Detects banned phrases
- [ ] Score calculation is accurate
- [ ] Regeneration logic works correctly
- [ ] UI displays scores clearly

---

## Next Steps

After completing this plan:
1. Proceed to **Plan 15: Frontend Orchestration**
