import { useState } from "react";

export function ColorSwatch({
	hex,
	shade,
	isCmykSafe,
	lightness,
}: {
	hex: string;
	shade: number;
	isCmykSafe: boolean;
	lightness: number;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(hex);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const textColor = lightness > 60 ? "#202020" : "#f0f0f0";
	const textOutlineColor = lightness > 60 ? "#f0f0f0" : "#202020";

	return (
		<button
			type="button"
			onClick={handleCopy}
			style={{
				backgroundColor: hex,
				color: textColor,
				flex: 1,
				minHeight: "75px",
				display: "flex",
				flexDirection: "column",
				justifyContent: "flex-end",
				padding: "0.5rem 1rem",
				cursor: "pointer",
				position: "relative",
				transition: "transform 0.2s, box-shadow 0.2s, z-index 0s",
				outline: "1px solid rgba(0,0,0,0.1)",
				outlineOffset: "-1px",
			}}
			className="color-swatch hover-effect"
			onMouseEnter={(e) => {
				e.currentTarget.style.transform = "scale(1.05)";
				e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.3)";
				e.currentTarget.style.zIndex = "10";
				e.currentTarget.style.borderRadius = "var(--radius-md)";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.transform = "scale(1)";
				e.currentTarget.style.boxShadow = "none";
				e.currentTarget.style.zIndex = "1";
				e.currentTarget.style.borderRadius = "0";
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-end",
				}}
			>
				<div style={{ display: "flex", flexDirection: "column" }}>
					<span
						style={{
							fontWeight: 700,
							fontSize: "1.1rem",
							textShadow: `-1px -1px 0 ${textOutlineColor}, 1px -1px 0 ${textOutlineColor}, -1px 1px 0 ${textOutlineColor}, 1px 1px 0 ${textOutlineColor}`,
						}}
					>
						{shade}
					</span>
					<span
						style={{
							fontFamily: "var(--font-mono)",
							opacity: 0.8,
							fontSize: "0.875rem",
							textShadow: `-1px -1px 0 ${textOutlineColor}, 1px -1px 0 ${textOutlineColor}, -1px 1px 0 ${textOutlineColor}, 1px 1px 0 ${textOutlineColor}`,
						}}
					>
						{copied ? "Copied!" : hex.toUpperCase()}
					</span>
				</div>
				{!isCmykSafe && (
					<span
						title="Out of gamut for CMYK"
						style={{
							fontSize: "1.2rem",
							filter: "drop-shadow(0 0 2px rgba(0,0,0,0.5))",
						}}
					>
						⚠️
					</span>
				)}
			</div>
		</button>
	);
}
