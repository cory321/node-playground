import { CheckCircle, AlertCircle, FileCode } from 'lucide-react';
import { SEOOptimizedPackage } from '@/types/seoPackage';

interface SchemaValidatorProps {
	output: SEOOptimizedPackage;
}

/**
 * SchemaValidator - Shows schema validation results
 */
export function SchemaValidator({ output }: SchemaValidatorProps) {
	const { validation, stats } = output;

	// Group schema types with their validation status
	const schemaStatus = new Map<string, { valid: number; invalid: number }>();

	for (const page of output.pages) {
		for (const schema of page.schema) {
			const current = schemaStatus.get(schema.type) || { valid: 0, invalid: 0 };
			if (schema.valid) {
				current.valid++;
			} else {
				current.invalid++;
			}
			schemaStatus.set(schema.type, current);
		}
	}

	const schemaEntries = Array.from(schemaStatus.entries()).sort((a, b) =>
		a[0].localeCompare(b[0]),
	);

	return (
		<div className="flex flex-col gap-2">
			{/* Schema Types Summary */}
			<div className="text-xs text-slate-400 mb-1">
				{stats.schemaTypesUsed.length} schema types in use
			</div>

			{/* Schema List */}
			<div className="max-h-40 overflow-y-auto space-y-1">
				{schemaEntries.map(([type, counts]) => (
					<div
						key={type}
						className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
							counts.invalid > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
						}`}
					>
						<div className="flex items-center gap-1.5">
							<FileCode size={12} className="text-slate-400" />
							<span className="text-white">{type}</span>
						</div>
						<div className="flex items-center gap-2">
							{counts.valid > 0 && (
								<div className="flex items-center gap-1 text-green-400">
									<CheckCircle size={10} />
									<span>{counts.valid}</span>
								</div>
							)}
							{counts.invalid > 0 && (
								<div className="flex items-center gap-1 text-red-400">
									<AlertCircle size={10} />
									<span>{counts.invalid}</span>
								</div>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Schema Errors */}
			{validation.schemaErrors.length > 0 && (
				<div className="mt-2">
					<div className="text-xs text-red-400 mb-1">
						Schema Errors ({validation.schemaErrors.length})
					</div>
					<div className="max-h-24 overflow-y-auto space-y-1">
						{validation.schemaErrors.slice(0, 5).map((error, i) => (
							<div
								key={i}
								className="text-[10px] bg-red-500/10 text-red-300 px-2 py-1 rounded"
							>
								<span className="font-medium">{error.schemaType}:</span>{' '}
								{error.message}
							</div>
						))}
						{validation.schemaErrors.length > 5 && (
							<div className="text-[10px] text-slate-500 px-2">
								+{validation.schemaErrors.length - 5} more errors
							</div>
						)}
					</div>
				</div>
			)}

			{/* All Valid Message */}
			{validation.schemaErrors.length === 0 && schemaEntries.length > 0 && (
				<div className="flex items-center gap-1.5 text-xs text-green-400 mt-1">
					<CheckCircle size={12} />
					<span>All schemas are valid</span>
				</div>
			)}
		</div>
	);
}

export default SchemaValidator;
