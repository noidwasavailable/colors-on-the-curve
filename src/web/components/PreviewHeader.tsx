interface PreviewHeaderProps {
	paletteCount: number;
	exportTokensEnabled: boolean;
	setExportTokensEnabled: (enabled: boolean) => void;
	onExport: () => void;
}

export function PreviewHeader({
	paletteCount,
	exportTokensEnabled,
	setExportTokensEnabled,
	onExport,
}: PreviewHeaderProps) {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				padding: "1.5rem 1.5rem 0",
				flexShrink: 0,
			}}
		>
			<div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
				<h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
					Preview
				</h2>
				<span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{paletteCount} palettes</span>
			</div>
			<div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
				<label
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.5rem",
						fontSize: "0.875rem",
						cursor: "pointer",
						color: "var(--text-muted)",
					}}
				>
					<input
						type="checkbox"
						checked={exportTokensEnabled}
						onChange={(e) => setExportTokensEnabled(e.target.checked)}
					/>
					Figma Tokens
				</label>
				<button
					type="button"
					className="btn active"
					onClick={onExport}
					disabled={paletteCount === 0}
				>
					Export JSON
				</button>
			</div>
		</div>
	);
}
