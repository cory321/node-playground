import {
	LocalKnowledgeOutput,
	LocalKnowledgeInput,
	createEmptyLocalKnowledge,
} from '@/types/localKnowledge';

/**
 * Check if Supabase is configured
 */
function hasSupabase(): boolean {
	const url = import.meta.env.VITE_SUPABASE_URL;
	const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
	return Boolean(url && key);
}

/**
 * Get Supabase configuration
 */
function getSupabaseConfig() {
	return {
		url: import.meta.env.VITE_SUPABASE_URL as string,
		anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
	};
}

export interface LocalKnowledgeResult {
	data: LocalKnowledgeOutput;
	success: boolean;
	error: string | null;
}

/**
 * Generate local knowledge for a given location and category
 * Calls the Supabase edge function which handles caching and Claude API calls
 */
export async function generateLocalKnowledge(
	input: LocalKnowledgeInput,
	bypassCache: boolean = false,
): Promise<LocalKnowledgeResult> {
	const { location, category } = input;

	// Check Supabase configuration
	if (!hasSupabase()) {
		console.warn('Supabase not configured, cannot generate local knowledge');
		return {
			data: createEmptyLocalKnowledge(
				location.city,
				location.state,
				category,
				'Supabase not configured',
			),
			success: false,
			error: 'Supabase not configured',
		};
	}

	const { url, anonKey } = getSupabaseConfig();

	try {
		const response = await fetch(`${url}/functions/v1/local-knowledge`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				apikey: anonKey,
				Authorization: `Bearer ${anonKey}`,
			},
			body: JSON.stringify({
				city: location.city,
				county: location.county,
				state: location.state,
				category,
				bypassCache,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const errorMessage =
				errorData.error || `HTTP ${response.status}: ${response.statusText}`;
			console.error(`Local knowledge generation failed:`, errorMessage);

			return {
				data: createEmptyLocalKnowledge(
					location.city,
					location.state,
					category,
					errorMessage,
				),
				success: false,
				error: errorMessage,
			};
		}

		const result = await response.json();

		// Check if there was a partial error (still returns 200 with data)
		if (result.error && result.data) {
			return {
				data: result.data as LocalKnowledgeOutput,
				success: false,
				error: result.error,
			};
		}

		return {
			data: result as LocalKnowledgeOutput,
			success: true,
			error: null,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		console.error(`Local knowledge generation error:`, errorMessage);

		return {
			data: createEmptyLocalKnowledge(
				location.city,
				location.state,
				category,
				errorMessage,
			),
			success: false,
			error: errorMessage,
		};
	}
}

/**
 * Check if local knowledge API is available
 */
export function isLocalKnowledgeAvailable(): boolean {
	return hasSupabase();
}
