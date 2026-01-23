import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Check, X, Star } from 'lucide-react';
import {
	ComparisonTable,
	ComparisonTableRow,
	ComparisonColumnType,
} from '@/types/comparisonPage';

interface ComparisonTablePreviewProps {
	table: ComparisonTable;
	maxRows?: number;
}

/**
 * Render a cell value based on column type
 */
function renderCellValue(
	value: string | number | boolean | null,
	type: ComparisonColumnType,
): React.ReactNode {
	if (value === null || value === undefined) {
		return <span className="text-slate-600">—</span>;
	}

	switch (type) {
		case 'rating':
			const rating = Number(value);
			return (
				<div className="flex items-center gap-1">
					<Star size={12} className="text-amber-400 fill-amber-400" />
					<span>{rating.toFixed(1)}</span>
				</div>
			);

		case 'badge':
			return value ? (
				<Check size={14} className="text-green-400" />
			) : (
				<X size={14} className="text-slate-600" />
			);

		case 'number':
			return typeof value === 'number' ? value.toLocaleString() : value;

		case 'text':
		default:
			return String(value);
	}
}

/**
 * ComparisonTablePreview - A sortable comparison table preview
 */
export function ComparisonTablePreview({
	table,
	maxRows = 5,
}: ComparisonTablePreviewProps) {
	const [sortColumn, setSortColumn] = useState(table.defaultSort.column);
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
		table.defaultSort.direction,
	);

	// Sort rows
	const sortedRows = useMemo(() => {
		const column = table.columns.find((c) => c.key === sortColumn);
		if (!column?.sortable) {
			return table.rows;
		}

		return [...table.rows].sort((a, b) => {
			const aVal = a.values[sortColumn];
			const bVal = b.values[sortColumn];

			// Handle null values
			if (aVal === null && bVal === null) return 0;
			if (aVal === null) return sortDirection === 'asc' ? 1 : -1;
			if (bVal === null) return sortDirection === 'asc' ? -1 : 1;

			// Compare values
			let comparison = 0;
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				comparison = aVal - bVal;
			} else {
				comparison = String(aVal).localeCompare(String(bVal));
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});
	}, [table, sortColumn, sortDirection]);

	// Limit displayed rows
	const displayedRows = sortedRows.slice(0, maxRows);
	const hiddenCount = sortedRows.length - displayedRows.length;

	// Handle header click for sorting
	const handleHeaderClick = (columnKey: string) => {
		const column = table.columns.find((c) => c.key === columnKey);
		if (!column?.sortable) return;

		if (sortColumn === columnKey) {
			setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortColumn(columnKey);
			setSortDirection('desc');
		}
	};

	// Columns to display (limit for space)
	const displayColumns = table.columns.slice(0, 5);

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-xs">
				<thead>
					<tr className="border-b border-slate-700">
						{displayColumns.map((column) => (
							<th
								key={column.key}
								className={`py-1.5 px-1.5 text-left font-medium text-slate-400 ${
									column.sortable ? 'cursor-pointer hover:text-white' : ''
								}`}
								onClick={() => handleHeaderClick(column.key)}
							>
								<div className="flex items-center gap-1">
									<span className="truncate">{column.label}</span>
									{column.sortable &&
										sortColumn === column.key &&
										(sortDirection === 'desc' ? (
											<ArrowDown size={10} />
										) : (
											<ArrowUp size={10} />
										))}
								</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{displayedRows.map((row, idx) => (
						<tr
							key={row.providerId}
							className={`border-b border-slate-800 ${
								row.featured ? 'bg-red-500/5' : ''
							} ${idx % 2 === 1 ? 'bg-slate-900/30' : ''}`}
						>
							{displayColumns.map((column) => (
								<td
									key={column.key}
									className={`py-1.5 px-1.5 ${
										column.key === 'name'
											? 'font-medium text-white'
											: 'text-slate-300'
									}`}
								>
									<div className="flex items-center gap-1">
										{row.featured && column.key === 'name' && (
											<span
												className="w-1.5 h-1.5 rounded-full bg-red-400"
												title="Top rated"
											/>
										)}
										{renderCellValue(row.values[column.key], column.type)}
									</div>
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>

			{hiddenCount > 0 && (
				<div className="text-xs text-slate-500 text-center py-1.5">
					+{hiddenCount} more provider{hiddenCount !== 1 ? 's' : ''}
				</div>
			)}
		</div>
	);
}

export default ComparisonTablePreview;
