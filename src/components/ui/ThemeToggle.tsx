import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const ThemeToggle = () => {
	const [isDark, setIsDark] = useState(false);
	const [mounted, setMounted] = useState(false);

	// Initialize theme state from DOM on mount
	useEffect(() => {
		setMounted(true);
		setIsDark(document.documentElement.classList.contains("dark"));
	}, []);

	// Listen for theme changes (e.g., from other instances or external changes)
	useEffect(() => {
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === "class") {
					setIsDark(document.documentElement.classList.contains("dark"));
				}
			});
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, []);

	// Re-sync state after Astro View Transitions
	useEffect(() => {
		const handlePageLoad = () => {
			setIsDark(document.documentElement.classList.contains("dark"));
		};

		document.addEventListener("astro:page-load", handlePageLoad);
		return () =>
			document.removeEventListener("astro:page-load", handlePageLoad);
	}, []);

	const toggleTheme = () => {
		const newTheme = isDark ? "light" : "dark";
		localStorage.setItem("theme", newTheme);
		document.documentElement.classList.toggle("dark", newTheme === "dark");
		setIsDark(newTheme === "dark");
	};

	// Prevent hydration mismatch by not rendering icons until mounted
	if (!mounted) {
		return (
			<Button
				type="button"
				size="icon"
				variant="ghost"
				aria-label="Toggle Theme"
				className="size-10 items-center justify-center rounded-full"
			>
				<span className="size-5" />
			</Button>
		);
	}

	return (
		<>
			{isDark ? (
				<Button
					size="icon"
					aria-label="Toggle Light Mode"
					className="text-background bg-default hover:bg-default/90 size-10 items-center justify-center rounded-full"
					onClick={toggleTheme}
				>
					{" "}
					<Icon icon="lucide:sun" className="size-6" />
				</Button>
			) : (
				<Button
					size="icon"
					aria-label="Toggle Dark Mode"
					className="bg-foreground hover:bg-foreground/90 size-10 items-center justify-center rounded-full"
					onClick={toggleTheme}
				>
					<Icon icon="lucide:moon" className="size-6" />
				</Button>
			)}
		</>
	);
};
