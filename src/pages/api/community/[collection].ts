/**
 * Unified Community Collections API Endpoint
 *
 * Handles paginated fetching for all community-based collections:
 * - churches
 * - events (local-events)
 * - news
 * - schools
 * - sports
 *
 * @example GET /api/community/sports?community=rio-grande-city&page=2&limit=20
 */
import type { APIRoute } from "astro";
import { getPayloadClient } from "@/payload";
import type { PayloadPaginatedDocs } from "@/payload/types";

/**
 * Supported collection types and their corresponding Payload method names
 */
const COLLECTION_CONFIG = {
	churches: {
		method: "getChurchesByMarketAreaSlug",
	},
	events: {
		method: "getLocalEventsByMarketAreaSlug",
	},
	news: {
		method: "getNewsByMarketAreaSlug",
	},
	schools: {
		method: "getSchoolsByMarketAreaSlug",
	},
	sports: {
		method: "getSportsByMarketAreaSlug",
	},
} as const;

type CollectionType = keyof typeof COLLECTION_CONFIG;

function isValidCollection(collection: string): collection is CollectionType {
	return collection in COLLECTION_CONFIG;
}

export const GET: APIRoute = async ({ params, url, locals }) => {
	const { collection } = params;
	const community = url.searchParams.get("community");
	const page = parseInt(url.searchParams.get("page") || "1", 10);
	const limit = parseInt(url.searchParams.get("limit") || "20", 10);
	const depth = parseInt(url.searchParams.get("depth") || "1", 10);

	// Validate collection type
	if (!collection || !isValidCollection(collection)) {
		return new Response(
			JSON.stringify({
				error: "Invalid collection",
				message: `Collection must be one of: ${Object.keys(COLLECTION_CONFIG).join(", ")}`,
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	// Validate community parameter
	if (!community) {
		return new Response(
			JSON.stringify({
				error: "Missing parameter",
				message: "Community slug is required",
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

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
		const { env } = locals.runtime;
		const payload = getPayloadClient({
			worker: env.PAYLOAD_CMS_WORKER,
			apiUrl: env.PAYLOAD_API_URL,
		});

		const config = COLLECTION_CONFIG[collection];
		const methodName = config.method as keyof typeof payload;

		// Call the appropriate Payload method dynamically
		const result = (await (
			payload[methodName] as (
				slug: string,
				params: { limit: number; page: number; depth: number },
			) => Promise<PayloadPaginatedDocs<unknown>>
		)(community, {
			limit,
			page,
			depth,
		})) as PayloadPaginatedDocs<unknown>;

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=60, s-maxage=300",
			},
		});
	} catch (error) {
		console.error(`Error fetching ${collection}:`, error);

		return new Response(
			JSON.stringify({
				error: "Fetch failed",
				message:
					error instanceof Error ? error.message : "Failed to fetch data",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
