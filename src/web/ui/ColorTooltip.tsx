interface ColorTooltipProps {
	shade: number;
	hex: string;
	copied: boolean;
}

export function ColorTooltip({ shade, hex, copied }: ColorTooltipProps) {
	return (
		<div
			style={{
				position: "absolute",
				bottom: "120%",
				left: "50%",
				transform: "translateX(-50%)",
				backgroundColor: "var(--bg-panel)",
				backdropFilter: "blur(12px)",
				color: "var(--text-main)",
				padding: "0.4rem 0.6rem",
				borderRadius: "var(--radius-sm)",
				border: "1px solid var(--border-color)",
				boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "0.2rem",
				zIndex: 100,
				whiteSpace: "nowrap",
				pointerEvents: "none",
			}}
		>
			<span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{shade}</span>
			<span
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "0.75rem",
					opacity: 0.8,
				}}
			>
				{copied ? "Copied!" : hex.toUpperCase()}
			</span>
		</div>
	);
}
