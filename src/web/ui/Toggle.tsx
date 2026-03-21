interface ToggleProps {
	id?: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	onLabel?: string;
	offLabel?: string;
}

export function Toggle({
	id,
	checked,
	onChange,
	onLabel = "ON",
	offLabel = "OFF",
}: ToggleProps) {
	return (
		<button
			id={id}
			type="button"
			className={`btn ${checked ? "active" : ""}`}
			onClick={() => onChange(!checked)}
			style={{ padding: "0.25rem 0.75rem", minWidth: "60px" }}
		>
			{checked ? onLabel : offLabel}
		</button>
	);
}
