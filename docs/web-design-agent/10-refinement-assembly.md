# Plan 10: Refinement & Assembly

> **Purpose:** Polish the complete page, validate quality, and assemble into a deployable Next.js project.

**Dependencies:** Plan 08 (Hero), Plan 09 (Sections)  
**Estimated Time:** 3-4 hours  
**Parallelizable With:** None

---

## Overview

This plan covers:
1. Refinement pass for consistency
2. SEO verification
3. Next.js project assembly
4. File structure generation

---

## Subtasks

### Refinement Prompt

- [ ] **10.1** Create refinement prompt

```typescript
export function buildRefinementPrompt(
  heroHtml: string,
  sections: SectionOutput[],
  designTokens: ExtractedDesignTokens,
  content: ContentStrategy
): string {
  const allHtml = [heroHtml, ...sections.map(s => s.html)].join('\n\n<!-- SECTION -->\n\n');
  
  return `<context>
Review this complete landing page and perform final refinements.
</context>

<current_page>
${allHtml}
</current_page>

<refinement_checklist>
1. Typography consistency — verify same fonts throughout
2. Color consistency — no rogue colors outside palette
3. Spacing rhythm — consistent use of spacing scale
4. Mobile responsiveness — check all breakpoints work
5. Animation polish — staggered load animations
6. Accessibility — ARIA labels, focus states
7. Form validation — inline error placeholders
8. Phone numbers — tel: links on all instances
</refinement_checklist>

<seo_verification>
- Title: ${content.seo.titleTag}
- Meta: ${content.seo.metaDescription}
- H1: ${content.seo.h1}
- Verify Schema.org LocalBusiness JSON-LD is complete
</seo_verification>

<output>
List specific changes made, then output the complete refined page HTML.
</output>`;
}
```

### Edge Function

- [ ] **10.2** Create `supabase/functions/refine-page/index.ts`

```typescript
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';
import { corsHeaders, createSupabaseClient, handleError } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req);
    const { jobId, heroHtml, sections, designTokens, content } = await req.json();

    const prompt = buildRefinementPrompt(heroHtml, sections, designTokens, content);

    const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 },
    });

    const refinedHtml = cleanupGeneratedHtml(result.response.text());

    await supabase
      .from('site_generations')
      .update({ status: 'refined' })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ html: refinedHtml }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
});
```

### Next.js Assembly

- [ ] **10.3** Create assembly function

```typescript
export interface NextJsProject {
  files: Record<string, string>;
}

export function assembleNextJsProject(
  identity: BusinessIdentity,
  designTokens: ExtractedDesignTokens,
  content: ContentStrategy,
  refinedHtml: string
): NextJsProject {
  const files: Record<string, string> = {};
  
  // package.json
  files['package.json'] = JSON.stringify({
    name: identity.name.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    },
    dependencies: {
      next: '^14.0.0',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@types/node': '^20',
      '@types/react': '^18',
      typescript: '^5',
      tailwindcss: '^3.4.0',
      postcss: '^8',
      autoprefixer: '^10',
    },
  }, null, 2);
  
  // next.config.js
  files['next.config.js'] = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
};
module.exports = nextConfig;`;
  
  // tailwind.config.js
  files['tailwind.config.js'] = generateTailwindConfig(designTokens);
  
  // postcss.config.js
  files['postcss.config.js'] = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;
  
  // tsconfig.json
  files['tsconfig.json'] = JSON.stringify({
    compilerOptions: {
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      paths: { '@/*': ['./*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
    exclude: ['node_modules'],
  }, null, 2);
  
  // app/layout.tsx
  files['app/layout.tsx'] = generateLayout(identity, designTokens, content);
  
  // app/page.tsx
  files['app/page.tsx'] = generatePage(refinedHtml);
  
  // app/globals.css
  files['app/globals.css'] = generateGlobalStyles(designTokens);
  
  // public/robots.txt
  files['public/robots.txt'] = `User-agent: *\nAllow: /`;
  
  return { files };
}
```

### Layout Generator

- [ ] **10.4** Create layout generator

```typescript
function generateLayout(
  identity: BusinessIdentity,
  designTokens: ExtractedDesignTokens,
  content: ContentStrategy
): string {
  const schemaOrg = generateSchemaOrg(identity, content);
  
  return `import type { Metadata } from 'next';
import { ${designTokens.typography.headlineFont.replace(/\s+/g, '_')}, ${designTokens.typography.bodyFont.replace(/\s+/g, '_')} } from 'next/font/google';
import './globals.css';

const headlineFont = ${designTokens.typography.headlineFont.replace(/\s+/g, '_')}({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = ${designTokens.typography.bodyFont.replace(/\s+/g, '_')}({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '${content.seo.titleTag}',
  description: '${content.seo.metaDescription}',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={\`\${headlineFont.variable} \${bodyFont.variable}\`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(${JSON.stringify(schemaOrg)}) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`;
}
```

### Schema.org Generator

- [ ] **10.5** Create Schema.org JSON-LD generator

```typescript
function generateSchemaOrg(identity: BusinessIdentity, content: ContentStrategy) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: identity.name,
    description: content.seo.metaDescription,
    telephone: content.footer.nap.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: content.footer.nap.address.split(',')[0],
      addressLocality: content.footer.nap.address.split(',')[1]?.trim(),
    },
    openingHours: content.footer.hours,
    areaServed: content.footer.serviceAreas.map(area => ({
      '@type': 'City',
      name: area,
    })),
  };
}
```

### Tailwind Config Generator

- [ ] **10.6** Create Tailwind config generator

```typescript
function generateTailwindConfig(tokens: ExtractedDesignTokens): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '${tokens.colors.primary}',
        secondary: '${tokens.colors.secondary}',
        accent: '${tokens.colors.accent}',
        surface: '${tokens.colors.surface}',
        'surface-alt': '${tokens.colors.surfaceAlt}',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};`;
}
```

### Edge Function for Assembly

- [ ] **10.7** Create `supabase/functions/assemble-nextjs/index.ts`

```typescript
import { corsHeaders, createSupabaseClient, handleError } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req);
    const { jobId, identity, designTokens, content, refinedHtml } = await req.json();

    const project = assembleNextJsProject(identity, designTokens, content, refinedHtml);

    await supabase
      .from('site_generations')
      .update({
        assembled_files: project.files,
        status: 'assembled',
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ files: Object.keys(project.files), fileCount: Object.keys(project.files).length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
});
```

### Frontend Client

- [ ] **10.8** Add assembly to API client

```typescript
export async function refinePage(
  jobId: string,
  heroHtml: string,
  sections: SectionOutput[],
  designTokens: ExtractedDesignTokens,
  content: ContentStrategy
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('refine-page', {
    body: { jobId, heroHtml, sections, designTokens, content },
  });
  if (error) throw error;
  return data.html;
}

export async function assembleProject(
  jobId: string,
  identity: BusinessIdentity,
  designTokens: ExtractedDesignTokens,
  content: ContentStrategy,
  refinedHtml: string
): Promise<{ files: string[]; fileCount: number }> {
  const { data, error } = await supabase.functions.invoke('assemble-nextjs', {
    body: { jobId, identity, designTokens, content, refinedHtml },
  });
  if (error) throw error;
  return data;
}
```

### Testing

- [ ] **10.9** Create tests

```typescript
describe('Assembly', () => {
  it('generates required files', () => {
    const project = assembleNextJsProject(
      mockIdentity,
      mockTokens,
      mockContent,
      '<div>Test</div>'
    );
    
    expect(project.files['package.json']).toBeDefined();
    expect(project.files['app/layout.tsx']).toBeDefined();
    expect(project.files['app/page.tsx']).toBeDefined();
  });
});
```

---

## Verification Checklist

- [ ] Refinement improves consistency
- [ ] All required Next.js files generate
- [ ] Schema.org JSON-LD is valid
- [ ] Tailwind config uses design tokens
- [ ] Project can be built with `npm run build`

---

## Next Steps

After completing this plan:
1. Proceed to **Plan 11: GitHub Integration**
