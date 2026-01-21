# Plan 01: Infrastructure Setup

> **Purpose:** Set up the Supabase database schema, storage buckets, and edge function boilerplate needed for the web design agent pipeline.

**Dependencies:** None  
**Estimated Time:** 2-3 hours  
**Parallelizable With:** None (must complete first)

---

## Prerequisites

- Supabase project already configured
- Supabase CLI installed
- Access to Supabase dashboard for secrets management

---

## Subtasks

### Database Schema

- [ ] **1.1** Create the `site_generations` table migration file at `supabase/migrations/YYYYMMDD_site_generations.sql`

```sql
CREATE TABLE site_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  status TEXT NOT NULL DEFAULT 'idle',

  -- Phase 1: Prepare
  input_location JSONB,           -- { city, state, lat, lng }
  input_category TEXT,
  input_serp_data JSONB,
  identity_json JSONB,            -- BusinessIdentity
  reference_image_url TEXT,       -- Gemini-generated screenshot
  design_tokens JSONB,            -- ExtractedDesignTokens
  content_strategy JSONB,         -- ContentStrategy

  -- Phase 2: Build
  hero_html TEXT,
  sections_json JSONB,            -- { sectionName: html }[]
  assembled_files JSONB,          -- { path: content }

  -- Phase 3: Deploy
  github_repo_url TEXT,
  preview_url TEXT,
  deployment_id TEXT,
  production_url TEXT,

  -- Metadata
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] **1.2** Add indexes for performance

```sql
CREATE INDEX idx_site_generations_project ON site_generations(project_id);
CREATE INDEX idx_site_generations_status ON site_generations(status);
CREATE INDEX idx_site_generations_created ON site_generations(created_at DESC);
```

- [ ] **1.3** Add updated_at trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_generations_updated_at
    BEFORE UPDATE ON site_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

- [ ] **1.4** Add RLS policies for site_generations

```sql
ALTER TABLE site_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project generations"
  ON site_generations FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own project generations"
  ON site_generations FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own project generations"
  ON site_generations FOR UPDATE
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
```

- [ ] **1.5** Run the migration: `supabase db push`

### Storage Setup

- [ ] **1.6** Create storage bucket for site assets

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true);
```

- [ ] **1.7** Add storage policies for site-assets bucket

```sql
CREATE POLICY "Public read access for site-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

CREATE POLICY "Authenticated users can upload to site-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-assets' AND auth.role() = 'authenticated');
```

### Edge Function Boilerplate

- [ ] **1.8** Create edge function directory structure

```bash
mkdir -p supabase/functions/generate-identity
mkdir -p supabase/functions/generate-reference
mkdir -p supabase/functions/extract-design
mkdir -p supabase/functions/generate-content
mkdir -p supabase/functions/generate-hero
mkdir -p supabase/functions/generate-section
mkdir -p supabase/functions/refine-page
mkdir -p supabase/functions/assemble-nextjs
mkdir -p supabase/functions/push-to-github
mkdir -p supabase/functions/deploy-to-vercel
mkdir -p supabase/functions/promote-to-production
```

- [ ] **1.9** Create shared utilities file at `supabase/functions/_shared/utils.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, x-client-info, apikey, content-type',
};

export function createSupabaseClient(req: Request) {
	return createClient(
		Deno.env.get('SUPABASE_URL')!,
		Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
	);
}

export async function updateJobStatus(
	supabase: ReturnType<typeof createClient>,
	jobId: string,
	status: string,
	additionalData?: Record<string, unknown>
) {
	const { error } = await supabase
		.from('site_generations')
		.update({ status, ...additionalData })
		.eq('id', jobId);

	if (error) throw error;
}

export function handleError(error: unknown): Response {
	console.error('Edge function error:', error);
	return new Response(
		JSON.stringify({
			error: error instanceof Error ? error.message : 'Unknown error',
		}),
		{
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		}
	);
}
```

- [ ] **1.10** Create template edge function file

```typescript
// Template for all edge functions
// supabase/functions/_template/index.ts
import {
	corsHeaders,
	createSupabaseClient,
	handleError,
	updateJobStatus,
} from '../_shared/utils.ts';

Deno.serve(async (req) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const supabase = createSupabaseClient(req);
		const body = await req.json();
		const { jobId } = body;

		// TODO: Implement function logic

		return new Response(JSON.stringify({ success: true }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return handleError(error);
	}
});
```

### Secrets Configuration

- [ ] **1.11** Document required secrets (add to README or secrets management)

```
Required Supabase Secrets:
- GOOGLE_AI_API_KEY     # For Gemini Image and text generation
- ANTHROPIC_API_KEY     # For Claude (backup/alternative)
- OPENAI_API_KEY        # For GPT (backup/alternative)
- GITHUB_TOKEN          # For repository creation
- VERCEL_TOKEN          # For deployment
- VERCEL_TEAM_ID        # Optional, for team deployments
```

- [ ] **1.12** Add secrets via Supabase CLI or dashboard

```bash
supabase secrets set GOOGLE_AI_API_KEY=your_key_here
supabase secrets set GITHUB_TOKEN=your_token_here
supabase secrets set VERCEL_TOKEN=your_token_here
```

### TypeScript Types

- [ ] **1.13** Create `src/types/site-generation.ts` with base interfaces

```typescript
export interface SiteGenerationJob {
	id: string;
	project_id: string;
	status: GenerationStage;

	// Phase 1
	input_location?: LocationInput;
	input_category?: string;
	input_serp_data?: SerpData;
	identity_json?: BusinessIdentity;
	reference_image_url?: string;
	design_tokens?: ExtractedDesignTokens;
	content_strategy?: ContentStrategy;

	// Phase 2
	hero_html?: string;
	sections_json?: SectionOutput[];
	assembled_files?: Record<string, string>;

	// Phase 3
	github_repo_url?: string;
	preview_url?: string;
	deployment_id?: string;
	production_url?: string;

	// Metadata
	error_message?: string;
	created_at: string;
	updated_at: string;
}

export type GenerationStage =
	| 'idle'
	| 'generating-identity'
	| 'generating-reference-image'
	| 'extracting-design-tokens'
	| 'generating-content'
	| 'awaiting-design-approval'
	| 'generating-hero'
	| 'generating-sections'
	| 'refining'
	| 'assembling'
	| 'pushing-to-github'
	| 'deploying-preview'
	| 'awaiting-preview-approval'
	| 'deploying-production'
	| 'complete'
	| 'error';

export interface LocationInput {
	city: string;
	state: string;
	lat?: number;
	lng?: number;
}

export interface SerpData {
	score: number;
	quality: string;
	urgency: string;
}
```

- [ ] **1.14** Export types from `src/types/index.ts`

```typescript
export * from './site-generation';
```

### API Client Skeleton

- [ ] **1.15** Create `src/api/site-generator/index.ts` client skeleton

```typescript
import { supabase } from '../supabase/client';
import type {
	SiteGenerationJob,
	GenerationStage,
} from '../../types/site-generation';

const FUNCTION_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

async function invokeFunction<T>(
	name: string,
	body: Record<string, unknown>
): Promise<T> {
	const { data, error } = await supabase.functions.invoke(name, { body });
	if (error) throw error;
	return data as T;
}

export async function getJob(jobId: string): Promise<SiteGenerationJob | null> {
	const { data, error } = await supabase
		.from('site_generations')
		.select('*')
		.eq('id', jobId)
		.single();

	if (error) throw error;
	return data;
}

export async function getLatestJob(
	projectId: string
): Promise<SiteGenerationJob | null> {
	const { data, error } = await supabase
		.from('site_generations')
		.select('*')
		.eq('project_id', projectId)
		.order('created_at', { ascending: false })
		.limit(1)
		.single();

	if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
	return data;
}

// Function stubs - to be implemented in later plans
export const generateIdentity = async (jobId: string, input: unknown) =>
	invokeFunction('generate-identity', { jobId, ...input });

export const generateReference = async (jobId: string, category: string) =>
	invokeFunction('generate-reference', { jobId, category });

export const extractDesign = async (jobId: string, imageUrl: string) =>
	invokeFunction('extract-design', { jobId, imageUrl });

export const generateContent = async (
	jobId: string,
	identity: unknown,
	category: string
) => invokeFunction('generate-content', { jobId, identity, category });
```

---

## Verification Checklist

- [ ] Migration runs without errors
- [ ] `site_generations` table visible in Supabase dashboard
- [ ] `site-assets` storage bucket created
- [ ] Edge function directories exist
- [ ] Shared utilities file compiles
- [ ] TypeScript types have no errors
- [ ] API client skeleton imports correctly

---

## Next Steps

After completing this plan:

1. Proceed to **Plan 02: Category Presets Module**
2. Can also start **Plan 03: Identity Generation** in parallel
