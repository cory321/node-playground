// Next.js Template Strings
// Base templates for generated files

/**
 * Root layout template
 */
export function rootLayoutTemplate(options: {
	brandName: string;
	tagline: string;
	domain: string;
}): string {
	return `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { SiteShell } from '@/components/layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: '${options.brandName}',
    template: '%s | ${options.brandName}',
  },
  description: '${options.tagline}',
  metadataBase: new URL('https://${options.domain}'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-body antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
`;
}

/**
 * Page template with metadata
 */
export function pageTemplate(options: {
	title: string;
	description: string;
	componentName: string;
	imports?: string[];
	content: string;
}): string {
	const imports = options.imports?.join('\n') || '';

	return `import { Metadata } from 'next';
${imports}

export const metadata: Metadata = {
  title: '${options.title}',
  description: '${options.description}',
};

export default function ${options.componentName}() {
  return (
    ${options.content}
  );
}
`;
}

/**
 * Dynamic page template with generateStaticParams
 */
export function dynamicPageTemplate(options: {
	title: string;
	description: string;
	componentName: string;
	params: string[];
	staticParamsFunction: string;
	content: string;
}): string {
	const paramsType = options.params
		.map((p) => `'${p}': string`)
		.join('; ');

	return `import { Metadata } from 'next';

interface PageProps {
  params: { ${paramsType} };
}

export async function generateStaticParams() {
  ${options.staticParamsFunction}
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: '${options.title}',
    description: '${options.description}',
  };
}

export default function ${options.componentName}({ params }: PageProps) {
  return (
    ${options.content}
  );
}
`;
}

/**
 * Client component template
 */
export function clientComponentTemplate(options: {
	componentName: string;
	props?: string;
	imports?: string[];
	content: string;
}): string {
	const imports = options.imports?.join('\n') || '';
	const propsType = options.props || '{}';

	return `'use client';

${imports}

interface ${options.componentName}Props ${propsType}

export function ${options.componentName}(props: ${options.componentName}Props) {
  return (
    ${options.content}
  );
}

export default ${options.componentName};
`;
}

/**
 * Server component template
 */
export function serverComponentTemplate(options: {
	componentName: string;
	props?: string;
	imports?: string[];
	content: string;
}): string {
	const imports = options.imports?.join('\n') || '';
	const propsType = options.props || '{}';

	return `${imports}

interface ${options.componentName}Props ${propsType}

export function ${options.componentName}(props: ${options.componentName}Props) {
  return (
    ${options.content}
  );
}

export default ${options.componentName};
`;
}

/**
 * CSS tokens template
 */
export function cssTokensTemplate(tokens: {
	colors: Record<string, string>;
	fonts: Record<string, string>;
	spacing: Record<string, string>;
	radii: Record<string, string>;
}): string {
	const colorVars = Object.entries(tokens.colors)
		.map(([key, value]) => `  --color-${key}: ${value};`)
		.join('\n');

	const fontVars = Object.entries(tokens.fonts)
		.map(([key, value]) => `  --font-${key}: ${value};`)
		.join('\n');

	const spacingVars = Object.entries(tokens.spacing)
		.map(([key, value]) => `  --spacing-${key}: ${value};`)
		.join('\n');

	const radiusVars = Object.entries(tokens.radii)
		.map(([key, value]) => `  --radius-${key}: ${value};`)
		.join('\n');

	return `/* Design Tokens - Auto-generated */
:root {
  /* Colors */
${colorVars}

  /* Typography */
${fontVars}

  /* Spacing */
${spacingVars}

  /* Border Radius */
${radiusVars}
}
`;
}

/**
 * Tailwind config template
 */
export function tailwindConfigTemplate(options: {
	colors: Record<string, string>;
	fonts: Record<string, string>;
}): string {
	const colorExtends = JSON.stringify(options.colors, null, 4);
	const fontExtends = JSON.stringify(options.fonts, null, 4);

	return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: ${colorExtends},
      fontFamily: ${fontExtends},
    },
  },
  plugins: [],
};
`;
}

/**
 * Data accessor template
 */
export function dataAccessorTemplate(options: {
	dataName: string;
	typeName: string;
	jsonPath: string;
	getFunctions: Array<{
		name: string;
		returnType: string;
		implementation: string;
	}>;
}): string {
	const functions = options.getFunctions
		.map(
			(fn) => `
export function ${fn.name}(): ${fn.returnType} {
  ${fn.implementation}
}`
		)
		.join('\n');

	return `import ${options.dataName}Data from '${options.jsonPath}';

${functions}
`;
}

/**
 * JSON-LD schema template
 */
export function jsonLdTemplate(schema: Record<string, unknown>): string {
	return `<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: ${JSON.stringify(JSON.stringify(schema))},
  }}
/>`;
}

/**
 * Sitemap template
 */
export function sitemapTemplate(baseUrl: string): string {
	return `import { MetadataRoute } from 'next';
import { getSitePlan } from '@/lib/data/sitePlan';

export default function sitemap(): MetadataRoute.Sitemap {
  const sitePlan = getSitePlan();
  const baseUrl = '${baseUrl}';

  return sitePlan.pages.map((page) => ({
    url: \`\${baseUrl}\${page.url}\`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: page.priority === 1 ? 1.0 : page.priority === 2 ? 0.8 : 0.6,
  }));
}
`;
}

/**
 * Robots.txt template
 */
export function robotsTemplate(baseUrl: string): string {
	return `import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: '${baseUrl}/sitemap.xml',
  };
}
`;
}
