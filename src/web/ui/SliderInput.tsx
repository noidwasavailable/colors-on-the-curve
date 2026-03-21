import { NumberInput } from "./NumberInput";

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
		<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
			<input
				type="range"
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
	);
}
