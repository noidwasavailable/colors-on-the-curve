import type React from "react";

interface NumberInputProps {
	id?: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (val: number) => void;
	className?: string;
	style?: React.CSSProperties;
}

export function NumberInput({
	id,
	value,
	min,
	max,
	step,
	onChange,
	className = "",
	style,
}: NumberInputProps) {
	const handleDec = () => onChange(Math.max(min, value - step));
	const handleInc = () => onChange(Math.min(max, value + step));

	return (
		<div style={{ display: "flex", gap: "0.25rem", ...style }}>
			<button
				type="button"
				className="btn"
				style={{ padding: "0 0.5rem", height: "2rem" }}
				onClick={handleDec}
				disabled={value <= min}
			>
				−
			</button>
			<input
				id={id}
				type="number"
				className={`number-input ${className}`}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				min={min}
				max={max}
				step={step}
				style={{
					flex: 1,
					textAlign: "center",
					height: "2rem",
					padding: "0.2rem",
					width: "4rem",
				}}
			/>
			<button
				type="button"
				className="btn"
				style={{ padding: "0 0.5rem", height: "2rem" }}
				onClick={handleInc}
				disabled={value >= max}
			>
				+
			</button>
		</div>
	);
}
