/**
 * Blog Posts API Endpoint
 *
 * Handles paginated fetching for blog posts
 *
 * @example GET /api/blog?page=2&limit=20
 */

import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { getPayloadClient } from "@/payload";

export const GET: APIRoute = async ({ url }) => {
	const page = parseInt(url.searchParams.get("page") || "1", 10);
	const limit = parseInt(url.searchParams.get("limit") || "20", 10);

	// Validate pagination parameters
	if (page < 1 || limit < 1 || limit > 100) {
		return new Response(
			JSON.stringify({
				error: "Invalid parameters",
				message: "Page must be >= 1, limit must be between 1 and 100",
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	try {
		const payload = getPayloadClient({
			worker: env.PAYLOAD_CMS_WORKER,
			apiUrl: env.PAYLOAD_API_URL,
		});

		const result = await payload.getBlogPosts({
			page,
			limit,
			sort: "-publishDate",
		});

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=60, stale-while-revalidate=300",
			},
		});
	} catch (error) {
		console.error("Failed to fetch blog posts:", error);

		return new Response(
			JSON.stringify({
				error: "Server error",
				message:
					error instanceof Error ? error.message : "Failed to fetch blog posts",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
