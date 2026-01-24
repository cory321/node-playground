import React, { useMemo } from 'react';
import { Copy, Check, File } from 'lucide-react';
import { GeneratedFile } from '@/types/codeGeneration';

interface CodePreviewProps {
	file: GeneratedFile | null;
	maxHeight?: number;
}

// Simple syntax highlighting using regex patterns
function highlightCode(code: string, language: string): React.ReactNode[] {
	const lines = code.split('\n');

	return lines.map((line, lineIndex) => {
		const tokens: React.ReactNode[] = [];
		let remaining = line;
		let key = 0;

		const patterns: Array<{
			regex: RegExp;
			className: string;
		}> = getPatterns(language);

		// Process each pattern
		while (remaining.length > 0) {
			let matched = false;

			for (const { regex, className } of patterns) {
				const match = remaining.match(regex);
				if (match && match.index === 0) {
					tokens.push(
						<span key={key++} className={className}>
							{match[0]}
						</span>,
					);
					remaining = remaining.slice(match[0].length);
					matched = true;
					break;
				}
			}

			if (!matched) {
				// No pattern matched, add the first character as plain text
				const nextSpecialIndex = findNextSpecialIndex(remaining, patterns);
				const plainText = remaining.slice(
					0,
					nextSpecialIndex > 0 ? nextSpecialIndex : remaining.length,
				);
				tokens.push(
					<span key={key++} className="text-slate-300">
						{plainText}
					</span>,
				);
				remaining = remaining.slice(plainText.length);
			}
		}

		return (
			<div key={lineIndex} className="leading-relaxed">
				<span className="select-none text-slate-600 w-8 inline-block text-right mr-4">
					{lineIndex + 1}
				</span>
				{tokens.length > 0 ? tokens : <span>&nbsp;</span>}
			</div>
		);
	});
}

function findNextSpecialIndex(
	text: string,
	patterns: Array<{ regex: RegExp; className: string }>,
): number {
	let minIndex = text.length;

	for (const { regex } of patterns) {
		const match = text.match(regex);
		if (match && match.index !== undefined && match.index < minIndex) {
			minIndex = match.index;
		}
	}

	return minIndex;
}

function getPatterns(
	language: string,
): Array<{ regex: RegExp; className: string }> {
	const common = [
		// Strings
		{ regex: /^"[^"]*"/, className: 'text-emerald-400' },
		{ regex: /^'[^']*'/, className: 'text-emerald-400' },
		{ regex: /^`[^`]*`/, className: 'text-emerald-400' },
		// Comments
		{ regex: /^\/\/.*/, className: 'text-slate-500 italic' },
		{ regex: /^\/\*[\s\S]*?\*\//, className: 'text-slate-500 italic' },
		// Numbers
		{ regex: /^\d+(\.\d+)?/, className: 'text-amber-400' },
	];

	const tsxPatterns = [
		...common,
		// Keywords
		{
			regex:
				/^(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|async|await|default|new|this|null|undefined|true|false)\b/,
			className: 'text-purple-400',
		},
		// JSX tags
		{ regex: /^<\/?[A-Z][a-zA-Z0-9]*/, className: 'text-cyan-400' },
		{ regex: /^<\/?[a-z][a-z0-9]*/, className: 'text-red-400' },
		// Types
		{
			regex: /^:\s*(string|number|boolean|void|any|unknown|never|object)\b/,
			className: 'text-yellow-400',
		},
		// Function calls
		{ regex: /^[a-zA-Z_][a-zA-Z0-9_]*(?=\()/, className: 'text-blue-400' },
		// Object keys
		{ regex: /^[a-zA-Z_][a-zA-Z0-9_]*(?=:)/, className: 'text-sky-300' },
		// Brackets
		{ regex: /^[{}[\]()]/, className: 'text-slate-400' },
		// Operators
		{
			regex: /^(=>|===|!==|==|!=|<=|>=|&&|\|\||[+\-*/%=<>!&|?:,;.])/,
			className: 'text-slate-400',
		},
	];

	const cssPatterns = [
		...common,
		// Properties
		{ regex: /^[a-z-]+(?=:)/, className: 'text-cyan-400' },
		// Values
		{ regex: /^#[0-9a-fA-F]{3,8}/, className: 'text-emerald-400' },
		// Selectors
		{ regex: /^\.[a-zA-Z_-][a-zA-Z0-9_-]*/, className: 'text-yellow-400' },
		{ regex: /^:root/, className: 'text-purple-400' },
		// Variables
		{ regex: /^--[a-zA-Z0-9-]+/, className: 'text-orange-400' },
		{ regex: /^var\([^)]+\)/, className: 'text-orange-400' },
	];

	const jsonPatterns = [
		// Strings (keys and values)
		{ regex: /^"[^"]*"(?=:)/, className: 'text-cyan-400' },
		{ regex: /^"[^"]*"/, className: 'text-emerald-400' },
		// Numbers
		{ regex: /^\d+(\.\d+)?/, className: 'text-amber-400' },
		// Booleans
		{ regex: /^(true|false|null)/, className: 'text-purple-400' },
		// Brackets
		{ regex: /^[{}[\],:]/, className: 'text-slate-400' },
	];

	switch (language) {
		case 'tsx':
		case 'ts':
		case 'jsx':
		case 'js':
			return tsxPatterns;
		case 'css':
			return cssPatterns;
		case 'json':
			return jsonPatterns;
		default:
			return common;
	}
}

function getLanguageFromPath(path: string): string {
	const ext = path.split('.').pop()?.toLowerCase() || '';
	const extMap: Record<string, string> = {
		tsx: 'tsx',
		ts: 'ts',
		jsx: 'jsx',
		js: 'js',
		css: 'css',
		json: 'json',
		md: 'markdown',
	};
	return extMap[ext] || 'text';
}

export function CodePreview({ file, maxHeight = 300 }: CodePreviewProps) {
	const [copied, setCopied] = React.useState(false);

	const language = useMemo(
		() => (file ? getLanguageFromPath(file.path) : 'text'),
		[file],
	);

	const highlightedCode = useMemo(
		() => (file ? highlightCode(file.content, language) : null),
		[file, language],
	);

	const handleCopy = async () => {
		if (file) {
			await navigator.clipboard.writeText(file.content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	if (!file) {
		return (
			<div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
				<div className="flex items-center justify-center h-32 text-slate-500 text-xs">
					Select a file to preview
				</div>
			</div>
		);
	}

	return (
		<div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 bg-slate-800/30">
				<div className="flex items-center gap-2">
					<File size={12} className="text-emerald-400" />
					<span className="text-xs font-medium text-slate-300 font-mono">
						{file.path}
					</span>
				</div>
				<button
					onClick={handleCopy}
					className="p-1 rounded hover:bg-slate-700 transition-colors"
					title="Copy to clipboard"
				>
					{copied ? (
						<Check size={14} className="text-green-400" />
					) : (
						<Copy size={14} className="text-slate-400" />
					)}
				</button>
			</div>

			{/* Code */}
			<div
				className="overflow-auto p-3 font-mono text-xs bg-slate-900/50"
				style={{ maxHeight: `${maxHeight}px` }}
			>
				<pre className="whitespace-pre">{highlightedCode}</pre>
			</div>
		</div>
	);
}

export default CodePreview;
