/**
 * Search API Endpoint
 *
 * Handles search queries against the Payload CMS search index.
 * Uses the worker binding for fast worker-to-worker communication.
 *
 * @example GET /api/search?q=keyword&limit=10&page=1&collection=blog
 */

import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { getPayloadClient } from "@/payload";

export const GET: APIRoute = async ({ url }) => {
	const query = url.searchParams.get("q") || "";
	const page = parseInt(url.searchParams.get("page") || "1", 10);
	const limit = parseInt(url.searchParams.get("limit") || "10", 10);
	const collection = url.searchParams.get("collection") || undefined;
	const sort = url.searchParams.get("sort") || "-priority";

	// Validate parameters
	if (page < 1 || limit < 1 || limit > 50) {
		return new Response(
			JSON.stringify({
				error: "Invalid parameters",
				message: "Page must be >= 1, limit must be between 1 and 50",
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	// Return empty results for empty query
	if (!query.trim()) {
		return new Response(
			JSON.stringify({
				docs: [],
				totalDocs: 0,
				totalPages: 0,
				page: 1,
				limit,
				hasNextPage: false,
				hasPrevPage: false,
				pagingCounter: 1,
				prevPage: null,
				nextPage: null,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	try {
		const payload = getPayloadClient({
			worker: env.PAYLOAD_CMS_WORKER,
			apiUrl: env.PAYLOAD_API_URL,
		});

		const result = await payload.search({
			query,
			page,
			limit,
			collection,
			sort,
		});

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				// Short cache for search results
				"Cache-Control": "public, max-age=30, stale-while-revalidate=60",
			},
		});
	} catch (error) {
		console.error("Search failed:", error);
		return new Response(
			JSON.stringify({
				error: "Search failed",
				message: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
