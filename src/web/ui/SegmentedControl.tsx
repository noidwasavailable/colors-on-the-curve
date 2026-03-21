export interface SegmentedControlProps<T extends string> {
	id?: string;
	options: readonly { value: T; label: string }[];
	value: T;
	onChange: (val: T) => void;
}

export function SegmentedControl<T extends string>({
	id,
	options,
	value,
	onChange,
}: SegmentedControlProps<T>) {
	return (
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
	);
}
