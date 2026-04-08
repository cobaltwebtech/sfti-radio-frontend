/**
 * Cache Debug Endpoint
 *
 * Test endpoint to inspect cache metadata from CMS responses via Service Binding.
 *
 * @example GET /api/debug/cache?collection=churches&limit=1
 */

import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { getPayloadClient } from "@/payload/client";

export const GET: APIRoute = async ({ url }) => {
	const collection = url.searchParams.get("collection") || "news";
	const limit = Number.parseInt(url.searchParams.get("limit") || "1", 10);
	const depth = Number.parseInt(url.searchParams.get("depth") || "1", 10);
	const skipCache = url.searchParams.get("skipCache") === "true";

	try {
		const payload = getPayloadClient({
			worker: env.PAYLOAD_CMS_WORKER,
			apiUrl: env.PAYLOAD_API_URL,
		});

		// Use cache-aware method to get metadata
		const result = await payload.getCollectionWithCache(collection, {
			limit,
			depth,
			skipCache,
		});

		return new Response(
			JSON.stringify(
				{
					collection,
					params: { limit, depth, skipCache },
					documentCount: result.data.docs.length,
					totalDocs: result.data.totalDocs,
					cache: result.cache,
					// Include first doc title/name for verification
					firstDoc: result.data.docs[0]
						? {
								id: (result.data.docs[0] as { id?: string }).id,
								name:
									(result.data.docs[0] as { name?: string }).name ||
									(result.data.docs[0] as { title?: string }).title ||
									"N/A",
							}
						: null,
				},
				null,
				2,
			),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		return new Response(
			JSON.stringify(
				{
					error: error instanceof Error ? error.message : "Unknown error",
					stack:
						error instanceof Error && process.env.NODE_ENV === "development"
							? error.stack
							: undefined,
				},
				null,
				2,
			),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
