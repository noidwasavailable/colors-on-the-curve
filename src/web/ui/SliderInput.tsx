import { NumberInput } from "./NumberInput";

const styles = `
.slider-input {
	appearance: none;
	height: 6px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: var(--radius-sm);
	outline: none;
}
.slider-input::-webkit-slider-thumb {
	appearance: none;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: var(--accent-color);
	cursor: pointer;
	transition: background 0.2s, transform 0.2s;
	box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
}
.slider-input::-webkit-slider-thumb:hover {
	background: var(--accent-hover);
	transform: scale(1.1);
}
`;
interface SliderInputProps {
	id?: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (val: number) => void;
}

export function SliderInput({
	id,
	value,
	min,
	max,
	step,
	onChange,
}: SliderInputProps) {
	return (
		<>
		<style>{styles}</style>
		<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
			<input
				type="range"
				className="slider-input"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				style={{ flex: 1 }}
			/>
			<NumberInput
				id={id}
				value={value}
				min={min}
				max={max}
				step={step}
				onChange={onChange}
				style={{ width: "100px" }}
			/>
		</div>
		</>
	);
}
