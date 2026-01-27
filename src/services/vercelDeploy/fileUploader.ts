/**
 * Vercel File Uploader
 * Handles file upload with SHA1 hashing for Vercel's deployment API
 */

import { FileToUpload, UploadedFile } from './types';

// ============================================================================
// SHA1 HASHING
// ============================================================================

/**
 * Calculate SHA1 hash of content using Web Crypto API
 */
async function calculateSha1(content: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(content);
	const hashBuffer = await crypto.subtle.digest('SHA-1', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate SHA1 hash for binary data (base64 encoded content)
 */
async function calculateSha1Binary(base64Content: string): Promise<string> {
	// Decode base64 to binary
	const binaryString = atob(base64Content);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	const hashBuffer = await crypto.subtle.digest('SHA-1', bytes);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

const VERCEL_API_BASE = 'https://api.vercel.com';

/**
 * Upload a single file to Vercel
 * @returns The SHA1 hash of the uploaded file
 */
export async function uploadFile(
	file: FileToUpload,
	token: string,
	teamId?: string
): Promise<UploadedFile> {
	const isBase64 = file.encoding === 'base64';
	
	// Calculate SHA1 hash
	const sha = isBase64 
		? await calculateSha1Binary(file.content)
		: await calculateSha1(file.content);
	
	// Calculate file size
	const size = isBase64
		? atob(file.content).length
		: new TextEncoder().encode(file.content).length;
	
	// Build URL with optional team ID
	const url = new URL(`${VERCEL_API_BASE}/v2/files`);
	if (teamId) {
		url.searchParams.set('teamId', teamId);
	}
	
	// Prepare body
	let body: ArrayBuffer | string;
	if (isBase64) {
		// Convert base64 to binary ArrayBuffer
		const binaryString = atob(file.content);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		body = bytes.buffer;
	} else {
		body = file.content;
	}
	
	// Upload file
	const response = await fetch(url.toString(), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Length': size.toString(),
			'x-vercel-digest': sha,
			'Content-Type': 'application/octet-stream',
		},
		body,
	});
	
	if (!response.ok) {
		// Check if file already exists (which is fine)
		if (response.status === 409) {
			// File already exists, that's okay
			return { path: file.path, sha, size };
		}
		
		const errorText = await response.text();
		throw new Error(`Failed to upload ${file.path}: ${response.status} ${errorText}`);
	}
	
	return { path: file.path, sha, size };
}

/**
 * Upload multiple files with progress callback
 */
export async function uploadFiles(
	files: FileToUpload[],
	token: string,
	options: {
		teamId?: string;
		onProgress?: (uploaded: number, total: number, currentFile: string) => void;
		abortSignal?: AbortSignal;
	} = {}
): Promise<UploadedFile[]> {
	const { teamId, onProgress, abortSignal } = options;
	const uploadedFiles: UploadedFile[] = [];
	
	for (let i = 0; i < files.length; i++) {
		if (abortSignal?.aborted) {
			throw new Error('Upload aborted');
		}
		
		const file = files[i];
		onProgress?.(i, files.length, file.path);
		
		const uploaded = await uploadFile(file, token, teamId);
		uploadedFiles.push(uploaded);
	}
	
	onProgress?.(files.length, files.length, 'Complete');
	return uploadedFiles;
}

/**
 * Batch upload files in parallel (up to concurrency limit)
 */
export async function uploadFilesParallel(
	files: FileToUpload[],
	token: string,
	options: {
		teamId?: string;
		concurrency?: number;
		onProgress?: (uploaded: number, total: number) => void;
		abortSignal?: AbortSignal;
	} = {}
): Promise<UploadedFile[]> {
	const { teamId, concurrency = 5, onProgress, abortSignal } = options;
	const uploadedFiles: UploadedFile[] = [];
	let uploadedCount = 0;
	
	// Process files in batches
	for (let i = 0; i < files.length; i += concurrency) {
		if (abortSignal?.aborted) {
			throw new Error('Upload aborted');
		}
		
		const batch = files.slice(i, i + concurrency);
		const results = await Promise.all(
			batch.map(file => uploadFile(file, token, teamId))
		);
		
		uploadedFiles.push(...results);
		uploadedCount += results.length;
		onProgress?.(uploadedCount, files.length);
	}
	
	return uploadedFiles;
}
