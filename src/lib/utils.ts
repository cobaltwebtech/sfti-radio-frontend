import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Validate that a URL is a safe, well-formed YouTube URL.
 *
 * Only allows `https://` URLs on the `youtube.com` or `youtu.be` domains
 * (including subdomains like `www.`). Rejects malformed URLs, non-http(s)
 * schemes (e.g. `javascript:`), and any other host. Used to guard against
 * malformed or malicious links before rendering them.
 */
export function isValidYouTubeUrl(
	url: string | null | undefined,
): url is string {
	if (!url) return false;

	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return false;
	}

	if (parsed.protocol !== "https:") return false;

	const host = parsed.hostname.toLowerCase();
	return (
		host === "youtube.com" ||
		host.endsWith(".youtube.com") ||
		host === "youtu.be"
	);
}
