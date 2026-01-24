// Config Generator
// Generates package.json, tsconfig.json, next.config.js, and README

import { CodeGenInputs, GeneratedFile } from '@/types/codeGeneration';

export interface GeneratorOptions {
	onFile?: (file: GeneratedFile) => void;
	abortSignal?: AbortSignal;
	includeReadme?: boolean;
}

/**
 * Generate configuration files
 */
export async function generateConfigFiles(
	inputs: CodeGenInputs,
	options: GeneratorOptions = {}
): Promise<GeneratedFile[]> {
	const { onFile, abortSignal, includeReadme = true } = options;
	const files: GeneratedFile[] = [];

	const emit = (file: GeneratedFile) => {
		files.push(file);
		onFile?.(file);
	};

	if (abortSignal?.aborted) return files;

	const { sitePlan } = inputs;

	// package.json
	emit({
		path: 'package.json',
		content: generatePackageJson(inputs),
		type: 'config',
		encoding: 'utf-8',
	});

	// tsconfig.json
	emit({
		path: 'tsconfig.json',
		content: generateTsConfig(),
		type: 'config',
		encoding: 'utf-8',
	});

	// next.config.js
	emit({
		path: 'next.config.js',
		content: generateNextConfig(inputs),
		type: 'config',
		encoding: 'utf-8',
	});

	// postcss.config.js
	emit({
		path: 'postcss.config.js',
		content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
		type: 'config',
		encoding: 'utf-8',
	});

	// .gitignore
	emit({
		path: '.gitignore',
		content: generateGitignore(),
		type: 'config',
		encoding: 'utf-8',
	});

	// README.md
	if (includeReadme) {
		emit({
			path: 'README.md',
			content: generateReadme(inputs),
			type: 'config',
			encoding: 'utf-8',
		});
	}

	return files;
}

/**
 * Generate package.json
 */
function generatePackageJson(inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;
	const projectName = sitePlan.brand.domain
		.replace(/\./g, '-')
		.replace(/[^a-z0-9-]/gi, '');

	const pkg = {
		name: projectName,
		version: '0.1.0',
		private: true,
		scripts: {
			dev: 'next dev',
			build: 'next build',
			start: 'next start',
			lint: 'next lint',
		},
		dependencies: {
			next: '^14.0.0',
			react: '^18.2.0',
			'react-dom': '^18.2.0',
			'lucide-react': '^0.294.0',
			clsx: '^2.0.0',
			'tailwind-merge': '^2.1.0',
		},
		devDependencies: {
			'@types/node': '^20.10.0',
			'@types/react': '^18.2.0',
			'@types/react-dom': '^18.2.0',
			autoprefixer: '^10.4.16',
			postcss: '^8.4.32',
			tailwindcss: '^3.3.6',
			typescript: '^5.3.0',
			eslint: '^8.55.0',
			'eslint-config-next': '^14.0.0',
		},
	};

	return JSON.stringify(pkg, null, 2);
}

/**
 * Generate tsconfig.json
 */
function generateTsConfig(): string {
	const config = {
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
			plugins: [{ name: 'next' }],
			paths: {
				'@/*': ['./src/*'],
			},
		},
		include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
		exclude: ['node_modules'],
	};

	return JSON.stringify(config, null, 2);
}

/**
 * Generate next.config.js
 */
function generateNextConfig(inputs: CodeGenInputs): string {
	return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
`;
}

/**
 * Generate .gitignore
 */
function generateGitignore(): string {
	return `# Dependencies
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
`;
}

/**
 * Generate README.md
 */
function generateReadme(inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;

	return `# ${sitePlan.brand.name}

${sitePlan.brand.tagline || 'Your trusted local resource'}

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Deploy to Vercel

This site is optimized for deployment on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Project Structure

- \`src/app/\` - Next.js App Router pages
- \`src/components/\` - React components
- \`src/lib/\` - Utility functions and data accessors
- \`public/data/\` - Static JSON data files

## Generated Info

- **City:** ${sitePlan.meta.city}
- **State:** ${sitePlan.meta.state}
- **Category:** ${sitePlan.meta.category}
- **Pages:** ${sitePlan.meta.pageCount}
- **Generated:** ${new Date().toISOString()}
`;
}
