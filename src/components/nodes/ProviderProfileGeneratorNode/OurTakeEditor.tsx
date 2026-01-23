import React, { useState } from 'react';
import { Save, X, Plus, Minus } from 'lucide-react';
import { OurTakeSection } from '@/types/generatedProfile';

interface OurTakeEditorProps {
	ourTake: OurTakeSection;
	onSave: (updated: OurTakeSection) => void;
	onCancel: () => void;
}

export function OurTakeEditor({ ourTake, onSave, onCancel }: OurTakeEditorProps) {
	const [assessment, setAssessment] = useState(ourTake.assessment);
	const [strengths, setStrengths] = useState([...ourTake.strengths]);
	const [considerations, setConsiderations] = useState([
		...ourTake.considerations,
	]);
	const [bestFor, setBestFor] = useState(ourTake.bestFor);
	const [pricePosition, setPricePosition] = useState(ourTake.pricePosition);

	const wordCount = assessment.split(/\s+/).filter((w) => w.length > 0).length;

	const handleSave = () => {
		onSave({
			...ourTake,
			assessment,
			strengths: strengths.filter((s) => s.trim().length > 0),
			considerations: considerations.filter((c) => c.trim().length > 0),
			bestFor,
			pricePosition,
		});
	};

	const addStrength = () => {
		setStrengths([...strengths, '']);
	};

	const removeStrength = (index: number) => {
		setStrengths(strengths.filter((_, i) => i !== index));
	};

	const updateStrength = (index: number, value: string) => {
		const updated = [...strengths];
		updated[index] = value;
		setStrengths(updated);
	};

	const addConsideration = () => {
		setConsiderations([...considerations, '']);
	};

	const removeConsideration = (index: number) => {
		setConsiderations(considerations.filter((_, i) => i !== index));
	};

	const updateConsideration = (index: number, value: string) => {
		const updated = [...considerations];
		updated[index] = value;
		setConsiderations(updated);
	};

	return (
		<div className="space-y-3">
			{/* Assessment Text */}
			<div>
				<div className="flex items-center justify-between mb-1">
					<label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
						Assessment
					</label>
					<span
						className={`text-[10px] ${wordCount >= 150 && wordCount <= 200 ? 'text-green-400' : 'text-slate-500'}`}
					>
						{wordCount} words
					</span>
				</div>
				<textarea
					value={assessment}
					onChange={(e) => setAssessment(e.target.value)}
					rows={5}
					className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
					placeholder="Write the editorial assessment..."
				/>
			</div>

			{/* Strengths */}
			<div>
				<div className="flex items-center justify-between mb-1">
					<label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
						Strengths
					</label>
					<button
						onClick={addStrength}
						className="text-[10px] text-slate-500 hover:text-green-400 flex items-center gap-0.5"
					>
						<Plus size={10} /> Add
					</button>
				</div>
				<div className="space-y-1">
					{strengths.map((strength, i) => (
						<div key={i} className="flex items-center gap-1">
							<input
								type="text"
								value={strength}
								onChange={(e) => updateStrength(i, e.target.value)}
								className="flex-1 bg-slate-800/50 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-green-500/50"
								placeholder="Enter strength..."
							/>
							<button
								onClick={() => removeStrength(i)}
								className="text-slate-600 hover:text-red-400 p-1"
							>
								<Minus size={10} />
							</button>
						</div>
					))}
				</div>
			</div>

			{/* Considerations */}
			<div>
				<div className="flex items-center justify-between mb-1">
					<label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
						Considerations
					</label>
					<button
						onClick={addConsideration}
						className="text-[10px] text-slate-500 hover:text-yellow-400 flex items-center gap-0.5"
					>
						<Plus size={10} /> Add
					</button>
				</div>
				<div className="space-y-1">
					{considerations.map((consideration, i) => (
						<div key={i} className="flex items-center gap-1">
							<input
								type="text"
								value={consideration}
								onChange={(e) => updateConsideration(i, e.target.value)}
								className="flex-1 bg-slate-800/50 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-yellow-500/50"
								placeholder="Enter consideration..."
							/>
							<button
								onClick={() => removeConsideration(i)}
								className="text-slate-600 hover:text-red-400 p-1"
							>
								<Minus size={10} />
							</button>
						</div>
					))}
				</div>
			</div>

			{/* Best For */}
			<div>
				<label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1">
					Best For
				</label>
				<input
					type="text"
					value={bestFor}
					onChange={(e) => setBestFor(e.target.value)}
					className="w-full bg-slate-800/50 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
					placeholder="Best for homeowners who..."
				/>
			</div>

			{/* Price Position */}
			<div>
				<label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1">
					Price Position
				</label>
				<input
					type="text"
					value={pricePosition}
					onChange={(e) => setPricePosition(e.target.value)}
					className="w-full bg-slate-800/50 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
					placeholder="Mid-range pricing for the area"
				/>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-end gap-2 pt-2">
				<button
					onClick={onCancel}
					className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
				>
					<X size={12} />
					Cancel
				</button>
				<button
					onClick={handleSave}
					className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-white rounded text-xs font-medium transition-colors"
				>
					<Save size={12} />
					Save Changes
				</button>
			</div>
		</div>
	);
}

export default OurTakeEditor;
