/**
 * Media URL Helper
 *
 * Constructs direct R2 URLs for media files
 * Uses PUBLIC_R2_URL env variable for the base URL
 */
import type { Media } from "@/payload";

/**
 * Get the direct R2 URL for a media file
 * @param media - The Media object from Payload CMS
 * @param r2BaseUrl - The R2 base URL from environment
 * @returns The full R2 URL or null if no filename
 */
export function getMediaUrl(media: Media | null | undefined, r2BaseUrl: string): string | null {
	if (!media?.filename) return null;
	// Ensure no double slashes by removing trailing slash from base URL
	const baseUrl = r2BaseUrl.replace(/\/$/, "");
	return `${baseUrl}/${media.filename}`;
}

/**
 * Type guard to check if featuredImage is a populated Media object
 */
export function isMediaObject(value: unknown): value is Media {
	return typeof value === "object" && value !== null && "filename" in value;
}
