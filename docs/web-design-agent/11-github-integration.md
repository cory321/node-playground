# Plan 11: GitHub Integration

> **Purpose:** Create GitHub repository and push the assembled Next.js project files.

**Dependencies:** Plan 10 (Assembly)  
**Estimated Time:** 2-3 hours  
**Parallelizable With:** Plan 12 (after repo created)

---

## Overview

This plan implements:
1. GitHub repository creation
2. Atomic file commit
3. Repository URL tracking

---

## Subtasks

### GitHub API Types

- [ ] **11.1** Define GitHub types

```typescript
export interface GitHubRepoResult {
  repoUrl: string;
  cloneUrl: string;
  repoName: string;
  owner: string;
}

export interface CreateRepoInput {
  name: string;           // "phoenix-plumbing-pros"
  description?: string;
  private?: boolean;
}

export interface PushFilesInput {
  owner: string;
  repo: string;
  files: Record<string, string>;  // path -> content
  message: string;
  branch?: string;
}
```

### Edge Function

- [ ] **11.2** Create `supabase/functions/push-to-github/index.ts`

```typescript
import { corsHeaders, createSupabaseClient, handleError } from '../_shared/utils.ts';

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')!;
const GITHUB_API = 'https://api.github.com';

async function githubFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GitHub API error: ${error.message || response.statusText}`);
  }
  
  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req);
    const { jobId, repoName, description, files } = await req.json();

    // Get authenticated user
    const user = await githubFetch('/user');
    const owner = user.login;

    // Create repository
    const repo = await githubFetch('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name: repoName,
        description: description || 'Generated website',
        private: true,
        auto_init: false,
      }),
    });

    // Create all files in a single commit using Git Data API
    const commitSha = await createInitialCommit(owner, repoName, files);

    // Update job
    await supabase
      .from('site_generations')
      .update({
        github_repo_url: repo.html_url,
        status: 'pushed-to-github',
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({
        repoUrl: repo.html_url,
        cloneUrl: repo.clone_url,
        repoName: repo.name,
        owner,
        commitSha,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
});
```

### Git Data API Implementation

- [ ] **11.3** Implement atomic commit with Git Data API

```typescript
async function createInitialCommit(
  owner: string,
  repo: string,
  files: Record<string, string>
): Promise<string> {
  // Create blobs for each file
  const blobs = await Promise.all(
    Object.entries(files).map(async ([path, content]) => {
      const blob = await githubFetch(`/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content: btoa(content),  // Base64 encode
          encoding: 'base64',
        }),
      });
      return { path, sha: blob.sha };
    })
  );

  // Create tree
  const tree = await githubFetch(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      tree: blobs.map(({ path, sha }) => ({
        path,
        mode: '100644',
        type: 'blob',
        sha,
      })),
    }),
  });

  // Create commit
  const commit = await githubFetch(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: 'Initial commit: Generated website',
      tree: tree.sha,
    }),
  });

  // Create main branch reference
  await githubFetch(`/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({
      ref: 'refs/heads/main',
      sha: commit.sha,
    }),
  });

  return commit.sha;
}
```

### Repository Name Generator

- [ ] **11.4** Create safe repo name generator

```typescript
export function generateRepoName(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')      // Trim hyphens from ends
    .substring(0, 100);           // GitHub limit
}

export function generateUniqueRepoName(businessName: string): string {
  const base = generateRepoName(businessName);
  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
}
```

### Frontend Client

- [ ] **11.5** Add GitHub functions to API client

```typescript
export async function pushToGitHub(
  jobId: string,
  businessName: string,
  files: Record<string, string>
): Promise<GitHubRepoResult> {
  const repoName = generateUniqueRepoName(businessName);
  
  const { data, error } = await supabase.functions.invoke('push-to-github', {
    body: {
      jobId,
      repoName,
      description: `Website for ${businessName}`,
      files,
    },
  });
  
  if (error) throw error;
  return data as GitHubRepoResult;
}
```

### Error Handling

- [ ] **11.6** Add GitHub-specific error handling

```typescript
export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly code: 'RATE_LIMIT' | 'REPO_EXISTS' | 'AUTH_FAILED' | 'UNKNOWN',
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

export function parseGitHubError(error: unknown): GitHubError {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('rate limit')) {
    return new GitHubError(message, 'RATE_LIMIT', true);
  }
  if (message.includes('already exists')) {
    return new GitHubError(message, 'REPO_EXISTS', true);
  }
  if (message.includes('401') || message.includes('403')) {
    return new GitHubError(message, 'AUTH_FAILED', false);
  }
  
  return new GitHubError(message, 'UNKNOWN', true);
}
```

### Testing

- [ ] **11.7** Create tests

```typescript
describe('GitHub Integration', () => {
  it('generates valid repo names', () => {
    expect(generateRepoName('Phoenix Plumbing Pros')).toBe('phoenix-plumbing-pros');
    expect(generateRepoName('Bob\'s HVAC & AC')).toBe('bobs-hvac-ac');
  });
  
  it('handles special characters', () => {
    expect(generateRepoName('Test!!!Name###')).toBe('test-name');
  });
});
```

---

## Verification Checklist

- [ ] Repositories create successfully
- [ ] All files commit atomically
- [ ] Private repo by default
- [ ] Repository URL saved to job
- [ ] Errors handled gracefully

---

## Next Steps

After completing this plan:
1. Proceed to **Plan 12: Vercel Deployment**
