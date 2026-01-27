/**
 * Screenshot Replicator Code Generator
 * Generates React/Tailwind code for each discovered section
 */

import { callClaudeWithVisionForCode } from '@/api/llm/anthropic';
import {
	ScreenshotAnalysis,
	DiscoveredSection,
	DiscoveredAsset,
	ReplicatorDesignTokens,
	GeneratedAsset,
	FormElementsAnalysis,
	FormElement,
	DecorativeElement,
	Badge,
	Rating,
	IconGroup,
} from '@/types/screenshotReplicator';
import { GeneratedFile } from '@/types/codeGeneration';

// ============================================================================
// TYPES
// ============================================================================

export interface CodeGenerationProgress {
	currentSection: string;
	currentIndex: number;
	totalSections: number;
	generatedFiles: GeneratedFile[];
}

export interface CodeGenerationOptions {
	onProgress?: (progress: CodeGenerationProgress) => void;
	abortSignal?: AbortSignal;
	/** Original screenshot URL for vision-assisted code generation */
	imageUrl?: string;
}

// Model to use for code generation
const CODE_MODEL = 'claude-opus-4-5-20251101';

// ============================================================================
// ASSET HELPERS
// ============================================================================

/**
 * Get the appropriate file extension based on asset type
 * Photos and avatars use .webp, icons and graphics use .png
 */
function getAssetExtension(assetType: string): string {
	return ['photo', 'avatar'].includes(assetType) ? 'webp' : 'png';
}

/**
 * Asset manifest for tracking asset paths and types
 */
export interface AssetManifest {
	[assetId: string]: {
		path: string;
		type: 'generated' | 'fallback-icon' | 'fallback-text' | 'missing';
		fallbackIcon?: string;
		dataUrl?: string;
	};
}

/**
 * Build an asset manifest that maps asset IDs to their paths and types
 */
export function buildAssetManifest(
	discoveredAssets: DiscoveredAsset[],
	generatedAssets: GeneratedAsset[]
): AssetManifest {
	const manifest: AssetManifest = {};

	for (const asset of discoveredAssets) {
		const generated = generatedAssets.find((g) => g.assetId === asset.id);

		if (asset.skipGeneration && asset.fallbackIcon) {
			manifest[asset.id] = {
				path: '',
				type: 'fallback-icon',
				fallbackIcon: asset.fallbackIcon,
			};
		} else if (asset.skipGeneration && asset.type === 'logo') {
			manifest[asset.id] = {
				path: '',
				type: 'fallback-text',
			};
		} else if (generated?.success && generated.dataUrl) {
			manifest[asset.id] = {
				path: generated.path,
				type: 'generated',
				dataUrl: generated.dataUrl,
			};
		} else {
			manifest[asset.id] = {
				path: `images/${asset.id}.${getAssetExtension(asset.type)}`,
				type: 'missing',
			};
		}
	}

	return manifest;
}

/**
 * Asset validation result
 */
interface AssetValidationResult {
	valid: GeneratedAsset[];
	missing: DiscoveredAsset[];
	failed: DiscoveredAsset[];
}

/**
 * Validate that all referenced assets have been properly generated
 */
function validateAssets(
	discoveredAssets: DiscoveredAsset[],
	generatedAssets: GeneratedAsset[]
): AssetValidationResult {
	const valid: GeneratedAsset[] = [];
	const missing: DiscoveredAsset[] = [];
	const failed: DiscoveredAsset[] = [];

	for (const asset of discoveredAssets) {
		if (asset.skipGeneration) continue;

		const generated = generatedAssets.find((g) => g.assetId === asset.id);
		if (!generated) {
			missing.push(asset);
		} else if (!generated.success || !generated.dataUrl) {
			failed.push(asset);
		} else {
			valid.push(generated);
		}
	}

	return { valid, missing, failed };
}

/**
 * Get placement instruction based on position value
 */
function getPlacementInstruction(position: string): string {
	if (position === 'background') {
		return 'Use as section background image (backgroundImage or Image fill)';
	} else if (position.includes('card-')) {
		return `Place inside ${position} element`;
	} else if (position === 'left' || position === 'right') {
		return `Place in ${position} column/side`;
	} else if (position.includes('grid-item-')) {
		return `Place in grid item ${position.replace('grid-item-', '')}`;
	} else if (position === 'center') {
		return 'Place centered in the section';
	}
	return `Place at position: ${position}`;
}

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Build pattern-specific hints based on detected form elements in this section
 */
function buildPatternHints(
	section: DiscoveredSection,
	formElements?: FormElementsAnalysis
): string {
	if (!formElements) return '';
	
	const sectionIndex = section.index;
	const hints: string[] = [];
	
	// Check for forms in this section
	const sectionForms = formElements.forms?.filter(f => f.sectionIndex === sectionIndex) || [];
	for (const form of sectionForms) {
		if (form.type === 'search') {
			const placeholder = form.elements?.[0]?.placeholder || 'Search...';
			hints.push(`SEARCH FORM DETECTED: This section contains a search form with an inline layout.
  - Create an <input type="text" placeholder="${placeholder}" /> element
  - Place the input BEFORE the button: "${form.submitButton || 'Search'}"
  - Use a flex container with the input taking most of the width
  - DO NOT create two buttons - one element is an INPUT field`);
		} else if (form.type === 'contact' || form.type === 'newsletter' || form.type === 'quote-request') {
			hints.push(`FORM DETECTED (${form.type}): This section contains a ${form.layout} form.
  - Create proper input elements for each field
  - Button label: "${form.submitButton || 'Submit'}"`);
		}
	}
	
	// Check for decorative elements (connectors, dividers)
	const sectionDecorative = formElements.decorativeElements?.filter(d => d.sectionIndex === sectionIndex) || [];
	for (const deco of sectionDecorative) {
		if (deco.type === 'connector-line') {
			hints.push(`CONNECTING LINES DETECTED: ${deco.description}
  - Use a flex container with items-center
  - Create horizontal lines using <div className="flex-1 h-[2px] bg-gray-300" /> between icon circles
  - The icons should be in circles, the lines connect them horizontally`);
		} else if (deco.type === 'divider' || deco.type === 'separator') {
			hints.push(`DIVIDER/SEPARATOR: Add a visual divider element at position: ${deco.position}`);
		}
	}
	
	// Check for badges
	const sectionBadges = formElements.badges?.filter(b => b.sectionIndex === sectionIndex) || [];
	if (sectionBadges.length > 0) {
		const badgeExamples = sectionBadges.slice(0, 3).map(b => 
			`"${b.text}" (bg: ${b.backgroundColor}, text: ${b.textColor})`
		).join(', ');
		hints.push(`COLORED BADGES DETECTED: ${sectionBadges.length} badge(s) found.
  Examples: ${badgeExamples}
  - Create small inline elements with rounded corners
  - Use the specific background and text colors shown
  - Typical structure: <span className="px-2 py-1 text-xs rounded bg-[${sectionBadges[0]?.backgroundColor}] text-[${sectionBadges[0]?.textColor}]">Badge Text</span>`);
	}
	
	// Check for ratings
	const sectionRatings = formElements.ratings?.filter(r => r.sectionIndex === sectionIndex) || [];
	if (sectionRatings.length > 0) {
		const rating = sectionRatings[0];
		hints.push(`STAR RATINGS DETECTED: ${sectionRatings.length} rating(s) found.
  Example: ${rating.stars} stars, ${rating.reviewCount || 'no count'}
  - Display stars using "★" character with text-yellow-500 color
  - Format: <span className="text-yellow-500">★</span> ${rating.stars} ${rating.reviewCount ? `(${rating.reviewCount})` : ''}`);
	}
	
	// Check for icon groups with connectors
	const sectionIconGroups = formElements.iconGroups?.filter(ig => ig.sectionIndex === sectionIndex) || [];
	for (const iconGroup of sectionIconGroups) {
		if (iconGroup.hasConnectors) {
			hints.push(`ICON GROUP WITH CONNECTORS: ${iconGroup.count} icons in ${iconGroup.layout} layout.
  - ${iconGroup.description || 'Icons connected by lines'}
  - Connector type: ${iconGroup.connectorType || 'horizontal-line'}
  - Use flexbox with items-center, place <div className="flex-1 h-0.5 bg-gray-300" /> between icon containers`);
		}
	}
	
	// Check for multi-column layout from section layout data
	if (section.layout?.multiColumn?.isMultiColumn) {
		const cols = section.layout.multiColumn.columns || [];
		const colDesc = cols.map(c => `${c.name} (${c.width})`).join(' | ');
		hints.push(`MULTI-COLUMN LAYOUT: This section has side-by-side content areas.
  Columns: ${colDesc}
  - Use CSS Grid: grid grid-cols-1 lg:grid-cols-2 (or appropriate ratio)
  - Each column is a distinct content area, not just items in a list
  - Responsive: ${section.layout.multiColumn.responsiveBehavior || 'stack-on-mobile'}`);
	}
	
	if (hints.length === 0) return '';
	
	return `
PATTERN-SPECIFIC INSTRUCTIONS FOR THIS SECTION:
${hints.map((h, i) => `${i + 1}. ${h}`).join('\n\n')}
`;
}

/**
 * Generate prompt for a single section with vision-assisted generation
 * The prompt references the visual screenshot that Claude can see
 */
function buildSectionPrompt(
	section: DiscoveredSection,
	sectionAssets: DiscoveredAsset[],
	designTokens: ReplicatorDesignTokens,
	generatedAssets: GeneratedAsset[],
	formElements?: FormElementsAnalysis
): string {
	// Build asset references with proper handling for all asset types
	const assetRefs = sectionAssets
		.map((asset) => {
			const generated = generatedAssets.find((g) => g.assetId === asset.id);

			// Handle icons that should use Lucide fallback
			if (asset.skipGeneration && asset.fallbackIcon) {
				return `- ${asset.id} (${asset.type}): USE LUCIDE ICON "${asset.fallbackIcon}" instead of image
    Purpose: "${asset.purpose}"
    Position: ${asset.position}
    IMPORTANT: Import and use <${asset.fallbackIcon} /> from lucide-react, NOT an image`;
			}

			// Handle logos that should be rendered as text
			if (asset.skipGeneration && asset.type === 'logo') {
				return `- ${asset.id} (logo): USE TEXT PLACEHOLDER
    Purpose: "${asset.purpose}"
    IMPORTANT: Render logo as styled text, not an image`;
			}

			// Normal generated asset with correct extension
			const extension = getAssetExtension(asset.type);
			const path = generated?.path || `images/${asset.id}.${extension}`;
			const placement = getPlacementInstruction(asset.position);

			return `- ${asset.id} (${asset.type})
    Purpose: "${asset.purpose}"
    Position: ${asset.position}
    Placement: ${placement}
    Path: "/${path}"`;
		})
		.join('\n\n');

	// Build pattern-specific hints based on form elements analysis
	const patternHints = buildPatternHints(section, formElements);

	// Build asset placement rules section
	const assetPlacementRules = sectionAssets.length > 0 ? `
ASSET PLACEMENT RULES:
- "background" position: Use as CSS background-image or Next.js Image with fill and object-cover
- "card-N" position: Place image at top of card N (inside the card container)
- "avatar" type: Always use rounded-full, typically small (40-60px)
- "left"/"right" position: Place in that column of a 2-column layout
- "grid-item-N" position: Place in grid cell N
` : '';

	return `You are looking at a website screenshot. Generate React/Tailwind code for section #${section.index}: "${section.name}".

VISUAL REFERENCE (LOOK AT THE SCREENSHOT):
- This section is approximately ${section.estimatedHeight || 'part'} of the page height
- Located at position ${section.index} from top (0 = first/top section)
- Find the "${section.name}" section in the screenshot and match it EXACTLY

CRITICAL VISUAL ELEMENTS TO MATCH:
1. EXACT layout structure - look at the screenshot for columns, grids, alignment
2. Form inputs (search bars, text fields) - these are inputs, NOT buttons
3. Decorative elements (connecting lines between icons, separators, dividers)
4. Badge/tag components with colored backgrounds (e.g., "Licensed & Insured" badges)
5. Star ratings with review counts (e.g., "★ 4.8 (230 Reviews)")
6. Card structures with internal hierarchy (image, title, rating, badges, text)
7. Side-by-side layouts - if two content areas are next to each other, use grid
8. Icon groups with connecting lines between them
${patternHints}${assetPlacementRules}
SECTION: ${section.name}
COMPONENT NAME: ${section.componentName}

TEXT CONTENT (use EXACTLY as shown - character for character):
${JSON.stringify(section.text, null, 2)}

LAYOUT INFO:
${JSON.stringify(section.layout, null, 2)}

ASSETS IN THIS SECTION:
${assetRefs || 'None'}

DESIGN TOKENS:
- Primary Color: ${designTokens.colors.primary}
- Secondary Color: ${designTokens.colors.secondary || 'none'}
- Accent Color: ${designTokens.colors.accent || designTokens.colors.primary}
- Background: ${designTokens.colors.background}
- Background Alt: ${designTokens.colors.backgroundAlt || designTokens.colors.background}
- Text Color: ${designTokens.colors.text}
- Text Muted: ${designTokens.colors.textMuted || designTokens.colors.text}
- Text Inverse: ${designTokens.colors.textInverse || '#ffffff'}
- Heading Font: ${designTokens.typography.headingFont}
- Body Font: ${designTokens.typography.bodyFont}
- Border Radius: ${designTokens.effects.borderRadius}
- Button Radius: ${designTokens.effects.buttonRadius || designTokens.effects.borderRadius}
- Shadow: ${designTokens.effects.shadow || 'shadow-sm'}
- Section Padding: ${designTokens.spacing.sectionPadding}
- Content Max Width: ${designTokens.spacing.contentMaxWidth}
- Gap: ${designTokens.spacing.gap}

REQUIREMENTS:
1. Export a default React functional component named "${section.componentName}"
2. Use Tailwind CSS for ALL styling - no inline styles or CSS modules
3. Use the EXACT text from TEXT CONTENT - copy it character for character
4. Reference images using Next.js Image component with the paths provided
5. VISUALLY MATCH the screenshot - the layout, spacing, and structure should look identical
6. Apply the design tokens for colors, fonts, and spacing
7. Include semantic HTML (section, article, nav, header, footer as appropriate)
8. Add appropriate aria-labels for accessibility
9. Make it responsive (mobile-first with sm:, md:, lg: breakpoints)
10. Do NOT add any comments or placeholder text
11. Only import from 'next/image', 'next/link', or 'lucide-react'

IMPORT RULES:
- Use Image from 'next/image' for all images
- Use Link from 'next/link' for all navigation links
- Use ONLY real Lucide icon names from 'lucide-react' (e.g., ShieldCheck, Star, Phone, MapPin, Fingerprint, Award)
- NEVER use generic names like "Icon", "IconComponent", or made-up icon names
- CRITICAL: Never import { Link } or { Image } from 'lucide-react' - they conflict with Next.js!
  - If you need a link icon, use { Link2 } or { ExternalLink } from 'lucide-react'
  - If you need an image/picture icon, use { ImageIcon } from 'lucide-react'

COMMON PATTERNS TO IMPLEMENT CORRECTLY:
- Search forms: Use <input type="text" placeholder="..." className="..." /> followed by a <button>
- Step icons with connectors: Use flexbox with border-based lines between icon circles
- Multi-column layouts: Use "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" patterns
- Testimonial cards: Circular avatar (rounded-full), quoted text, attribution
- Rating stars: Use text like "★ 4.8" or filled/empty star characters
- Colored badges: Small rounded elements with background color and contrasting text

OUTPUT FORMAT:
Return ONLY the component code. Start with ALL necessary imports:

import Image from 'next/image';
import Link from 'next/link';
import { IconName1, IconName2 } from 'lucide-react'; // Include ALL icons you use!

CRITICAL: You MUST include the lucide-react import with ALL icon components you use in the code.
If you use <ShieldCheck />, <MapPin />, <Star />, etc., they MUST be in your import statement.
Missing imports will cause build failures.

Then export the component. Do not include markdown code fences or explanations.`;
}

/**
 * Build prompt for the main page component
 */
function buildPagePrompt(
	sections: DiscoveredSection[],
	designTokens: ReplicatorDesignTokens
): string {
	const imports = sections
		.map(s => `import ${s.componentName} from './components/${s.componentName}';`)
		.join('\n');
	
	const components = sections
		.map(s => `        <${s.componentName} />`)
		.join('\n');
	
	return `Generate a main page component that renders all sections in order.

SECTIONS (in order):
${sections.map((s, i) => `${i + 1}. ${s.componentName} - ${s.name}`).join('\n')}

Generate this exact structure:

${imports}

export default function Page() {
  return (
    <main className="min-h-screen" style={{ fontFamily: '${designTokens.typography.bodyFont}' }}>
${components}
    </main>
  );
}

Return ONLY the code, no markdown fences.`;
}

/**
 * Build CSS tokens file content
 */
function buildTokensCss(designTokens: ReplicatorDesignTokens): string {
	return `:root {
  /* Colors */
  --color-primary: ${designTokens.colors.primary};
  --color-secondary: ${designTokens.colors.secondary || designTokens.colors.primary};
  --color-accent: ${designTokens.colors.accent || designTokens.colors.primary};
  --color-background: ${designTokens.colors.background};
  --color-background-alt: ${designTokens.colors.backgroundAlt || designTokens.colors.background};
  --color-text: ${designTokens.colors.text};
  --color-text-muted: ${designTokens.colors.textMuted || designTokens.colors.text};
  --color-text-inverse: ${designTokens.colors.textInverse || '#ffffff'};

  /* Typography */
  --font-heading: ${designTokens.typography.headingFont};
  --font-body: ${designTokens.typography.bodyFont};
  --font-size-h1: ${designTokens.typography.h1Size};
  --font-size-h2: ${designTokens.typography.h2Size};
  --font-size-h3: ${designTokens.typography.h3Size};
  --font-size-body: ${designTokens.typography.bodySize};
  --font-size-small: ${designTokens.typography.smallSize};

  /* Spacing */
  --spacing-section: ${designTokens.spacing.sectionPadding};
  --spacing-gap: ${designTokens.spacing.gap};
  --max-width-content: ${designTokens.spacing.contentMaxWidth};

  /* Effects */
  --border-radius: ${designTokens.effects.borderRadius};
  --shadow: ${designTokens.effects.shadow || 'none'};
}
`;
}

// ============================================================================
// IMPORT VALIDATION
// ============================================================================

/**
 * Components that should NOT be detected as Lucide icons
 * These are either Next.js components, React built-ins, or common false positives
 */
const NON_LUCIDE_COMPONENTS = new Set([
	// Next.js components
	'Image', 'Link', 'Script', 'Head',
	// Common React patterns
	'Fragment', 'Suspense', 'StrictMode', 'Component', 'PureComponent',
	// HTML elements that might be capitalized in error
	'Button', 'Input', 'Form', 'Select', 'Option', 'Table', 'Div', 'Span',
	// Custom component patterns we generate
	'Section', 'Page', 'Layout', 'Header', 'Footer', 'Nav', 'Main',
	// Common false positives - generic component names Claude might generate
	'Icon', 'IconComponent', 'IconWrapper', 'IconContainer',
	'Card', 'CardIcon', 'ServiceCard', 'FeatureCard', 'TestimonialCard',
	'Container', 'Wrapper', 'Provider', 'Context',
]);

/**
 * Validate and fix missing imports in generated code
 * Detects usage of Link/Image components and Lucide icons, injects imports if missing
 * Uses dynamic detection - any PascalCase JSX component not in NON_LUCIDE_COMPONENTS is assumed to be a Lucide icon
 */
function validateAndFixImports(code: string): string {
	let result = code;
	const imports: string[] = [];

	// Check for Image usage without import
	if (/<Image[\s>]/.test(code) && !/import\s+Image\s+from\s+['"]next\/image['"]/.test(code)) {
		imports.push("import Image from 'next/image';");
	}

	// Check for Link usage without import
	if (/<Link[\s>]/.test(code) && !/import\s+Link\s+from\s+['"]next\/link['"]/.test(code)) {
		imports.push("import Link from 'next/link';");
	}

	// Dynamically detect Lucide icon usage
	// Only check if there's no existing lucide-react import
	if (!/import\s+\{[^}]+\}\s+from\s+['"]lucide-react['"]/.test(code)) {
		// Find all PascalCase JSX components: <ComponentName or <ComponentName>
		// PascalCase = starts with uppercase, contains only letters and numbers
		const jsxComponentPattern = /<([A-Z][a-zA-Z0-9]*)[\s/>]/g;
		const usedIcons = new Set<string>();
		
		let match;
		while ((match = jsxComponentPattern.exec(code)) !== null) {
			const componentName = match[1];
			// Skip if it's a known non-Lucide component
			if (!NON_LUCIDE_COMPONENTS.has(componentName)) {
				// Skip if it looks like a custom Section component (Section0_Hero, etc.)
				if (!/^Section\d+/.test(componentName)) {
					usedIcons.add(componentName);
				}
			}
		}
		
		if (usedIcons.size > 0) {
			const iconList = Array.from(usedIcons).sort().join(', ');
			imports.push(`import { ${iconList} } from 'lucide-react';`);
		}
	}

	// If we need to add imports, prepend them
	if (imports.length > 0) {
		// Check if there's a 'use client' directive that needs to stay at the top
		const useClientMatch = result.match(/^(['"]use client['"];?\s*\n?)/);
		if (useClientMatch) {
			// Insert imports after 'use client'
			result = useClientMatch[0] + imports.join('\n') + '\n' + result.slice(useClientMatch[0].length);
		} else {
			// Prepend imports at the top
			result = imports.join('\n') + '\n' + result;
		}
	}

	return result;
}

// ============================================================================
// CODE GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate code for a single section using vision-assisted generation
 */
async function generateSectionCode(
	section: DiscoveredSection,
	allAssets: DiscoveredAsset[],
	designTokens: ReplicatorDesignTokens,
	generatedAssets: GeneratedAsset[],
	imageUrl: string,
	formElements?: FormElementsAnalysis
): Promise<string> {
	// Get assets for this section
	const sectionAssets = allAssets.filter(a => section.assetIds.includes(a.id));
	
	// Build the prompt with pattern-specific hints from form elements analysis
	const prompt = buildSectionPrompt(section, sectionAssets, designTokens, generatedAssets, formElements);
	
	// Call Claude with vision to generate the code - Claude can SEE the screenshot
	const response = await callClaudeWithVisionForCode(prompt, imageUrl, CODE_MODEL);
	
	// Clean up the response
	let code = response.trim();
	
	// Remove markdown code fences if present
	if (code.startsWith('```')) {
		code = code.replace(/^```(?:tsx|typescript|javascript|jsx)?\n?/, '').replace(/\n?```$/, '');
	}
	
	// Remove any stray text before imports/exports (LLM sometimes outputs extra text)
	// Find the first valid code start: import, export, "use client", or const/function at top level
	const codeStartPatterns = [
		/^["']use client["'];?\s*/m,
		/^import\s+/m,
		/^export\s+/m,
		/^const\s+/m,
		/^function\s+/m,
	];
	
	for (const pattern of codeStartPatterns) {
		const match = code.match(pattern);
		if (match && match.index !== undefined && match.index > 0) {
			// Found valid code start after some garbage - trim the garbage
			code = code.slice(match.index);
			break;
		}
	}
	
	// Also clean any trailing garbage after the last closing brace
	const lastBrace = code.lastIndexOf('}');
	if (lastBrace !== -1 && lastBrace < code.length - 1) {
		const afterBrace = code.slice(lastBrace + 1).trim();
		// If there's non-whitespace after the last brace that isn't a semicolon, trim it
		if (afterBrace && !/^;?\s*$/.test(afterBrace)) {
			code = code.slice(0, lastBrace + 1);
		}
	}
	
	// Validate and fix any missing Next.js imports
	code = validateAndFixImports(code);
	
	return code.trim();
}

/**
 * Generate the main page component
 */
function generatePageCode(
	sections: DiscoveredSection[],
	designTokens: ReplicatorDesignTokens
): string {
	const imports = sections
		.map(s => `import ${s.componentName} from './components/${s.componentName}';`)
		.join('\n');
	
	const components = sections
		.map(s => `      <${s.componentName} />`)
		.join('\n');
	
	return `${imports}

export default function Page() {
  return (
    <main className="min-h-screen bg-[var(--color-background)]" style={{ fontFamily: 'var(--font-body)' }}>
${components}
    </main>
  );
}
`;
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate all code files for the replicated page
 * Uses vision-assisted generation when imageUrl is provided
 */
export async function generateCode(
	analysis: ScreenshotAnalysis,
	generatedAssets: GeneratedAsset[],
	options: CodeGenerationOptions = {}
): Promise<GeneratedFile[]> {
	const { onProgress, abortSignal, imageUrl } = options;
	const { sections, assets, designTokens, formElements } = analysis;

	if (!imageUrl) {
		throw new Error('imageUrl is required for vision-assisted code generation');
	}

	// Validate assets before code generation
	const validation = validateAssets(assets, generatedAssets);
	if (validation.missing.length > 0 || validation.failed.length > 0) {
		console.warn(
			`Asset validation: ${validation.missing.length} missing, ${validation.failed.length} failed`
		);
		if (validation.missing.length > 0) {
			console.warn('Missing assets:', validation.missing.map((a) => a.id).join(', '));
		}
		if (validation.failed.length > 0) {
			console.warn('Failed assets:', validation.failed.map((a) => a.id).join(', '));
		}
	}

	// Build asset manifest for consistent path references
	const assetManifest = buildAssetManifest(assets, generatedAssets);
	console.log('Asset manifest built:', Object.keys(assetManifest).length, 'assets');

	const files: GeneratedFile[] = [];
	
	// Generate CSS tokens file first
	files.push({
		path: 'styles/tokens.css',
		content: buildTokensCss(designTokens),
		type: 'style',
		encoding: 'utf-8',
	});
	
	// Generate each section component
	for (let i = 0; i < sections.length; i++) {
		// Check for abort
		if (abortSignal?.aborted) {
			throw new Error('Code generation aborted');
		}
		
		const section = sections[i];
		
		// Report progress
		if (onProgress) {
			onProgress({
				currentSection: section.name,
				currentIndex: i,
				totalSections: sections.length,
				generatedFiles: [...files],
			});
		}
		
		// Generate section code with vision assistance and pattern hints
		const code = await generateSectionCode(
			section,
			assets,
			designTokens,
			generatedAssets,
			imageUrl,
			formElements
		);
		
		files.push({
			path: `components/${section.componentName}.tsx`,
			content: code,
			type: 'component',
			encoding: 'utf-8',
		});
	}
	
	// Generate main page component
	files.push({
		path: 'page.tsx',
		content: generatePageCode(sections, designTokens),
		type: 'page',
		encoding: 'utf-8',
	});
	
	// Final progress report
	if (onProgress) {
		onProgress({
			currentSection: 'Complete',
			currentIndex: sections.length,
			totalSections: sections.length,
			generatedFiles: files,
		});
	}
	
	return files;
}

/**
 * Calculate total bytes of generated code
 */
export function calculateCodeBytes(files: GeneratedFile[]): number {
	return files.reduce(
		(total, file) => total + new TextEncoder().encode(file.content).length,
		0
	);
}
