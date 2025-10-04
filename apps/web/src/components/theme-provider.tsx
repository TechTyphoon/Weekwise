import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	const [mounted, setMounted] = React.useState(false);

	// Prevent hydration mismatch by only rendering after mount
	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		// Return children without theme provider during SSR
		return <>{children}</>;
	}

	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export { useTheme } from "next-themes";
