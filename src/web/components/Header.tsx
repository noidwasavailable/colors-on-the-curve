const styles = {
	header: {
		padding: "1.5rem",
		borderBottom: "1px solid var(--border-color)",
	},
	h1: {
		fontFamily: "var(--font-display)",
		fontSize: "1.5rem",
		margin: 0,
		fontWeight: 700 as const,
		background: "linear-gradient(135deg, #fff 0%, #a5b4fc 100%)",
		WebkitBackgroundClip: "text",
		WebkitTextFillColor: "transparent",
	}
} as const;

export function Header() {
	return (
		<header style={styles.header}>
			<h1 style={styles.h1}>Colors on the Curve</h1>
		</header>
	);
}
