# Plan 12: Vercel Deployment

> **Purpose:** Deploy the Next.js project to Vercel for preview and production.

**Dependencies:** Plan 11 (GitHub)  
**Estimated Time:** 2-3 hours  
**Parallelizable With:** None

---

## Overview

This plan implements:

1. Vercel project creation
2. GitHub integration
3. Preview deployment
4. Production promotion

---

## Subtasks

### Vercel Types

- [ ] **12.1** Define Vercel types

```typescript
export interface VercelDeployResult {
	deploymentId: string;
	previewUrl: string;
	status: 'building' | 'ready' | 'error';
	projectId: string;
}

export interface VercelProjectResult {
	projectId: string;
	projectName: string;
}
```

### Edge Function

- [ ] **12.2** Create `supabase/functions/deploy-to-vercel/index.ts`

```typescript
import {
	corsHeaders,
	createSupabaseClient,
	handleError,
} from '../_shared/utils.ts';

const VERCEL_TOKEN = Deno.env.get('VERCEL_TOKEN')!;
const VERCEL_TEAM_ID = Deno.env.get('VERCEL_TEAM_ID');
const VERCEL_API = 'https://api.vercel.com';

async function vercelFetch(endpoint: string, options: RequestInit = {}) {
	const url = new URL(`${VERCEL_API}${endpoint}`);
	if (VERCEL_TEAM_ID) url.searchParams.set('teamId', VERCEL_TEAM_ID);

	const response = await fetch(url.toString(), {
		...options,
		headers: {
			Authorization: `Bearer ${VERCEL_TOKEN}`,
			'Content-Type': 'application/json',
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(
			`Vercel API error: ${error.error?.message || response.statusText}`
		);
	}

	return response.json();
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const supabase = createSupabaseClient(req);
		const { jobId, githubRepoUrl, projectName } = await req.json();

		// Extract owner/repo from GitHub URL
		const [owner, repo] = githubRepoUrl
			.replace('https://github.com/', '')
			.split('/');

		// Create Vercel project linked to GitHub
		const project = await vercelFetch('/v10/projects', {
			method: 'POST',
			body: JSON.stringify({
				name: projectName,
				gitRepository: {
					type: 'github',
					repo: `${owner}/${repo}`,
				},
				framework: 'nextjs',
				buildCommand: 'npm run build',
				outputDirectory: 'out',
			}),
		});

		// Wait for initial deployment
		await new Promise((resolve) => setTimeout(resolve, 5000));

		// Get deployments
		const deployments = await vercelFetch(
			`/v6/deployments?projectId=${project.id}&limit=1`
		);
		const deployment = deployments.deployments[0];

		// Update job
		await supabase
			.from('site_generations')
			.update({
				preview_url: `https://${deployment?.url || project.name + '.vercel.app'}`,
				deployment_id: deployment?.uid,
				status: 'deployed-preview',
			})
			.eq('id', jobId);

		return new Response(
			JSON.stringify({
				projectId: project.id,
				projectName: project.name,
				deploymentId: deployment?.uid,
				previewUrl: `https://${deployment?.url || project.name + '.vercel.app'}`,
				status: deployment?.readyState || 'building',
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		return handleError(error);
	}
});
```

### Production Promotion

- [ ] **12.3** Create `supabase/functions/promote-to-production/index.ts`

```typescript
Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const supabase = createSupabaseClient(req);
		const { jobId, deploymentId, customDomain } = await req.json();

		// Promote deployment to production
		const promotion = await vercelFetch(
			`/v13/deployments/${deploymentId}/promote`,
			{
				method: 'POST',
				body: JSON.stringify({ target: 'production' }),
			}
		);

		let productionUrl = promotion.url;

		// Add custom domain if provided
		if (customDomain) {
			const { data: job } = await supabase
				.from('site_generations')
				.select('project_id')
				.eq('id', jobId)
				.single();

			await vercelFetch(`/v10/projects/${job.project_id}/domains`, {
				method: 'POST',
				body: JSON.stringify({ name: customDomain }),
			});

			productionUrl = customDomain;
		}

		await supabase
			.from('site_generations')
			.update({
				production_url: `https://${productionUrl}`,
				status: 'complete',
			})
			.eq('id', jobId);

		return new Response(
			JSON.stringify({ productionUrl: `https://${productionUrl}` }),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		return handleError(error);
	}
});
```

### Deployment Status Polling

- [ ] **12.4** Create deployment status checker

```typescript
export async function waitForDeployment(
	deploymentId: string,
	maxWaitMs = 180000,
	pollIntervalMs = 5000
): Promise<{ ready: boolean; url: string }> {
	const startTime = Date.now();

	while (Date.now() - startTime < maxWaitMs) {
		const { data } = await supabase.functions.invoke(
			'check-deployment-status',
			{
				body: { deploymentId },
			}
		);

		if (data.readyState === 'READY') {
			return { ready: true, url: data.url };
		}

		if (data.readyState === 'ERROR') {
			throw new Error(`Deployment failed: ${data.errorMessage}`);
		}

		await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
	}

	throw new Error('Deployment timed out');
}
```

### Frontend Client

- [ ] **12.5** Add Vercel functions to API client

```typescript
export async function deployToVercel(
	jobId: string,
	githubRepoUrl: string,
	projectName: string
): Promise<VercelDeployResult> {
	const { data, error } = await supabase.functions.invoke('deploy-to-vercel', {
		body: { jobId, githubRepoUrl, projectName },
	});

	if (error) throw error;
	return data as VercelDeployResult;
}

export async function promoteToProduction(
	jobId: string,
	deploymentId: string,
	customDomain?: string
): Promise<{ productionUrl: string }> {
	const { data, error } = await supabase.functions.invoke(
		'promote-to-production',
		{
			body: { jobId, deploymentId, customDomain },
		}
	);

	if (error) throw error;
	return data;
}
```

### Error Handling

- [ ] **12.6** Add Vercel-specific errors

```typescript
export class VercelError extends Error {
	constructor(
		message: string,
		public readonly code:
			| 'RATE_LIMIT'
			| 'BUILD_FAILED'
			| 'QUOTA_EXCEEDED'
			| 'UNKNOWN',
		public readonly retryable: boolean
	) {
		super(message);
		this.name = 'VercelError';
	}
}
```

### Testing

- [ ] **12.7** Create tests

```typescript
describe('Vercel Deployment', () => {
	it('handles deployment status correctly', async () => {
		// Test status polling logic
	});
});
```

---

## Verification Checklist

- [ ] Projects create successfully
- [ ] GitHub integration works
- [ ] Preview URL accessible
- [ ] Production promotion works
- [ ] Custom domain support works

---

## Next Steps

After completing this plan:

1. Proceed to **Plan 13: Preview Approval UI**
