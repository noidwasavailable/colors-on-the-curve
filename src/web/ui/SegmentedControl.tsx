export interface SegmentedControlProps<T extends string> {
	id?: string;
	options: readonly { value: T; label: string }[];
	value: T;
	onChange: (val: T) => void;
}

const styles = `
.segmented-control {
	display: flex;
	border-radius: var(--radius-md);
	background: rgba(0, 0, 0, 0.2);
	border: 1px solid var(--border-color);
	overflow: hidden;
}
.segmented-btn {
	flex: 1;
	background: transparent;
	border: none;
	border-right: 1px solid var(--border-color);
	color: var(--text-muted);
	padding: 0.4rem 0.2rem;
	font-family: var(--font-sans);
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
}
.segmented-btn:last-child { border-right: none; }
.segmented-btn:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-main); }
.segmented-btn.active { background: var(--accent-color); color: #fff; }
`;

export function SegmentedControl<T extends string>({
	id,
	options,
	value,
	onChange,
}: SegmentedControlProps<T>) {
	return (
		<>
		<style>{styles}</style>
		<div className="segmented-control" id={id}>
			{options.map((opt) => (
				<button
					key={opt.value}
					type="button"
					className={`segmented-btn ${value === opt.value ? "active" : ""}`}
					onClick={() => onChange(opt.value)}
				>
					{opt.label}
				</button>
			))}
		</div>
		</>
	);
}
