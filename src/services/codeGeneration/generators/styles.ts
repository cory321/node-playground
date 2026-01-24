// Style Generator
// Generates CSS tokens and Tailwind config from Brand Design

import { CodeGenInputs, GeneratedFile } from '@/types/codeGeneration';
import { BrandDesignOutput, ColorToken } from '@/types/brandDesign';

export interface GeneratorOptions {
	onFile?: (file: GeneratedFile) => void;
	abortSignal?: AbortSignal;
}

/**
 * Generate style-related files from brand design
 */
export async function generateStyleFiles(
	inputs: CodeGenInputs,
	options: GeneratorOptions = {}
): Promise<GeneratedFile[]> {
	const { onFile, abortSignal } = options;
	const files: GeneratedFile[] = [];

	const emit = (file: GeneratedFile) => {
		files.push(file);
		onFile?.(file);
	};

	if (abortSignal?.aborted) return files;

	const { brandDesign } = inputs;

	// Generate CSS custom properties
	emit({
		path: 'src/styles/tokens.css',
		content: generateTokensCSS(brandDesign),
		type: 'style',
		encoding: 'utf-8',
	});

	// Generate globals.css
	emit({
		path: 'src/styles/globals.css',
		content: generateGlobalsCSS(brandDesign),
		type: 'style',
		encoding: 'utf-8',
	});

	// Generate Tailwind config
	emit({
		path: 'tailwind.config.js',
		content: generateTailwindConfig(brandDesign),
		type: 'config',
		encoding: 'utf-8',
	});

	return files;
}

/**
 * Generate CSS custom properties from brand tokens
 */
function generateTokensCSS(brandDesign: BrandDesignOutput): string {
	const { designSystem } = brandDesign;
	const { colors, typography, spacing } = designSystem;

	const lines: string[] = [
		'/* Design Tokens - Auto-generated from Brand Design */',
		'/* Do not edit manually - regenerate from source */',
		'',
		':root {',
		'  /* Colors */',
	];

	// Primary color
	if (colors.primary) {
		lines.push(`  --color-primary: ${getColorValue(colors.primary)};`);
		if (colors.primary.dark) {
			lines.push(`  --color-primary-dark: ${colors.primary.dark};`);
		}
		if (colors.primary.light) {
			lines.push(`  --color-primary-light: ${colors.primary.light};`);
		}
	}

	// Secondary color
	if (colors.secondary) {
		lines.push(`  --color-secondary: ${getColorValue(colors.secondary)};`);
	}

	// Accent color
	if (colors.accent) {
		lines.push(`  --color-accent: ${getColorValue(colors.accent)};`);
	}

	// Background colors
	lines.push('');
	lines.push('  /* Backgrounds */');
	if (colors.backgrounds) {
		if (colors.backgrounds.main) {
			lines.push(`  --color-background-main: ${colors.backgrounds.main};`);
		}
		if (colors.backgrounds.section) {
			lines.push(`  --color-background-section: ${colors.backgrounds.section};`);
		}
		if (colors.backgrounds.card) {
			lines.push(`  --color-background-card: ${colors.backgrounds.card};`);
		}
		if (colors.backgrounds.footer) {
			lines.push(`  --color-background-footer: ${colors.backgrounds.footer};`);
		}
	}

	// Text colors
	lines.push('');
	lines.push('  /* Text */');
	if (colors.text) {
		if (colors.text.primary) {
			lines.push(`  --color-text-primary: ${colors.text.primary};`);
		}
		if (colors.text.secondary) {
			lines.push(`  --color-text-secondary: ${colors.text.secondary};`);
		}
		if (colors.text.muted) {
			lines.push(`  --color-text-muted: ${colors.text.muted};`);
		}
		if (colors.text.inverse) {
			lines.push(`  --color-text-inverse: ${colors.text.inverse};`);
		}
	}

	// Semantic colors
	if (colors.semantic) {
		lines.push('');
		lines.push('  /* Semantic */');
		if (colors.semantic.success) {
			lines.push(`  --color-success: ${colors.semantic.success};`);
		}
		if (colors.semantic.warning) {
			lines.push(`  --color-warning: ${colors.semantic.warning};`);
		}
		if (colors.semantic.error) {
			lines.push(`  --color-error: ${colors.semantic.error};`);
		}
		if (colors.semantic.info) {
			lines.push(`  --color-info: ${colors.semantic.info};`);
		}
	}

	// Typography
	lines.push('');
	lines.push('  /* Typography */');
	if (typography?.fontFamily) {
		const headingFont = getFontStack(typography.fontFamily.heading);
		const bodyFont = getFontStack(typography.fontFamily.body);
		lines.push(`  --font-heading: ${headingFont};`);
		lines.push(`  --font-body: ${bodyFont};`);
	}

	if (typography?.scale) {
		lines.push('');
		lines.push('  /* Type Scale */');
		if (typography.scale.h1) lines.push(`  --text-h1: ${typography.scale.h1};`);
		if (typography.scale.h2) lines.push(`  --text-h2: ${typography.scale.h2};`);
		if (typography.scale.h3) lines.push(`  --text-h3: ${typography.scale.h3};`);
		if (typography.scale.h4) lines.push(`  --text-h4: ${typography.scale.h4};`);
		if (typography.scale.body) lines.push(`  --text-body: ${typography.scale.body};`);
		if (typography.scale.small) lines.push(`  --text-small: ${typography.scale.small};`);
	}

	if (typography?.lineHeight) {
		lines.push('');
		lines.push('  /* Line Heights */');
		if (typography.lineHeight.tight) lines.push(`  --leading-tight: ${typography.lineHeight.tight};`);
		if (typography.lineHeight.normal) lines.push(`  --leading-normal: ${typography.lineHeight.normal};`);
		if (typography.lineHeight.relaxed) lines.push(`  --leading-relaxed: ${typography.lineHeight.relaxed};`);
	}

	// Spacing
	lines.push('');
	lines.push('  /* Spacing */');
	if (spacing) {
		if (spacing.sectionPadding) {
			lines.push(`  --spacing-section-y: ${spacing.sectionPadding};`);
		}
		if (spacing.contentMaxWidth) {
			lines.push(`  --spacing-content-max: ${spacing.contentMaxWidth};`);
		}
		if (spacing.cardPadding) {
			lines.push(`  --spacing-card: ${spacing.cardPadding};`);
		}
	}

	// Border radius
	lines.push('');
	lines.push('  /* Border Radius */');
	const components = designSystem.components;
	if (components?.buttons?.borderRadius) {
		lines.push(`  --radius-button: ${components.buttons.borderRadius};`);
	}
	if (components?.cards?.borderRadius) {
		lines.push(`  --radius-card: ${components.cards.borderRadius};`);
	}
	lines.push('  --radius-sm: 0.25rem;');
	lines.push('  --radius-md: 0.5rem;');
	lines.push('  --radius-lg: 1rem;');
	lines.push('  --radius-full: 9999px;');

	lines.push('}');

	return lines.join('\n');
}

/**
 * Generate globals.css
 */
function generateGlobalsCSS(brandDesign: BrandDesignOutput): string {
	return `/* Global styles - Auto-generated */
@import './tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: var(--font-body);
    color: var(--color-text-primary);
    background-color: var(--color-background-main);
    line-height: var(--leading-normal, 1.6);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    line-height: var(--leading-tight, 1.2);
  }

  h1 {
    font-size: var(--text-h1, 2.5rem);
  }

  h2 {
    font-size: var(--text-h2, 2rem);
  }

  h3 {
    font-size: var(--text-h3, 1.5rem);
  }

  h4 {
    font-size: var(--text-h4, 1.25rem);
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
}

@layer components {
  .container-content {
    max-width: var(--spacing-content-max, 1280px);
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .section-padding {
    padding-top: var(--spacing-section-y, 4rem);
    padding-bottom: var(--spacing-section-y, 4rem);
  }
}
`;
}

/**
 * Generate Tailwind config
 */
function generateTailwindConfig(brandDesign: BrandDesignOutput): string {
	const { designSystem } = brandDesign;
	const { colors, typography } = designSystem;

	// Build color extensions
	const colorExtensions: Record<string, string> = {
		primary: 'var(--color-primary)',
		'primary-dark': 'var(--color-primary-dark)',
		'primary-light': 'var(--color-primary-light)',
	};

	if (colors.secondary) {
		colorExtensions.secondary = 'var(--color-secondary)';
	}
	if (colors.accent) {
		colorExtensions.accent = 'var(--color-accent)';
	}

	// Background colors
	colorExtensions['bg-main'] = 'var(--color-background-main)';
	colorExtensions['bg-section'] = 'var(--color-background-section)';
	colorExtensions['bg-card'] = 'var(--color-background-card)';
	colorExtensions['bg-footer'] = 'var(--color-background-footer)';

	// Text colors
	colorExtensions['text-primary'] = 'var(--color-text-primary)';
	colorExtensions['text-secondary'] = 'var(--color-text-secondary)';
	colorExtensions['text-muted'] = 'var(--color-text-muted)';

	return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: ${JSON.stringify(colorExtensions, null, 8).replace(/"/g, "'")},
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
      fontSize: {
        h1: 'var(--text-h1)',
        h2: 'var(--text-h2)',
        h3: 'var(--text-h3)',
        h4: 'var(--text-h4)',
      },
      spacing: {
        section: 'var(--spacing-section-y)',
        content: 'var(--spacing-content-max)',
      },
      borderRadius: {
        button: 'var(--radius-button)',
        card: 'var(--radius-card)',
      },
    },
  },
  plugins: [],
};
`;
}

/**
 * Get color value from ColorToken
 */
function getColorValue(color: ColorToken | string): string {
	if (typeof color === 'string') return color;
	return color.base || color.hex || '#000000';
}

/**
 * Build font stack from font family config
 */
function getFontStack(font: { name: string; fallback?: string } | string): string {
	if (typeof font === 'string') {
		return `'${font}', sans-serif`;
	}
	const fallback = font.fallback || 'sans-serif';
	return `'${font.name}', ${fallback}`;
}
