import { useState } from "react";
import { ColorTooltip } from "@/web/ui/ColorTooltip";

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
	const [isHovered, setIsHovered] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(hex);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const textColor = lightness > 60 ? "#202020" : "#f0f0f0";

	return (
		<button
			type="button"
			onClick={handleCopy}
			style={{
				backgroundColor: hex,
				color: textColor,
				flex: 1,
				height: "36px",
				cursor: "pointer",
				position: "relative",
				transition: "transform 0.2s, box-shadow 0.2s, z-index 0s",
				outline: "1px solid rgba(0,0,0,0.1)",
				outlineOffset: "-1px",
				border: "none",
				padding: 0,
			}}
			className="color-swatch"
			onMouseEnter={(e) => {
				setIsHovered(true);
				e.currentTarget.style.transform = "scale(1.05)";
				e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.3)";
				e.currentTarget.style.zIndex = "10";
				e.currentTarget.style.borderRadius = "var(--radius-md)";
			}}
			onMouseLeave={(e) => {
				setIsHovered(false);
				e.currentTarget.style.transform = "scale(1)";
				e.currentTarget.style.boxShadow = "none";
				e.currentTarget.style.zIndex = "1";
				e.currentTarget.style.borderRadius = "0";
			}}
		>
			{isHovered && <ColorTooltip shade={shade} hex={hex} copied={copied} />}
			{!isCmykSafe && (
				<span
					title="Out of gamut for CMYK"
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						fontSize: "1rem",
						filter: "drop-shadow(0 0 2px rgba(0,0,0,0.5))",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					⚠️
				</span>
			)}
		</button>
	);
}
