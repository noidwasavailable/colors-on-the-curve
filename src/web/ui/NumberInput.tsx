import type React from "react";

const styles = `
.number-input {
	background: rgba(0, 0, 0, 0.2);
	border: 1px solid var(--border-color);
	color: var(--text-main);
	border-radius: var(--radius-sm);
	font-family: var(--font-mono);
	font-size: 0.875rem;
	outline: none;
	padding: 0.4rem;
}
.number-input:focus { border-color: var(--border-color-focus); }
.number-input::-webkit-inner-spin-button,
.number-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.number-input[type="number"] { appearance: textfield; -moz-appearance: textfield; }
`;
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
		<>
		<style>{styles}</style>
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
		</>
	);
}
