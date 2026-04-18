/**
 * Local Events Collection Configuration
 *
 * Types and methods for the Local Events collection in Payload CMS
 * Local events are associated with a MarketArea (community)
 */
import type { Media, PayloadPaginatedDocs, RichText } from "../types";
import type { MarketArea } from "./market-areas";

export interface LocalEvent {
	id: string;
	marketArea: string | MarketArea;
	title: string;
	slug?: string | null;
	description: string;
	featuredImage?: string | Media | null;
	eventDate: string;
	eventEndDate?: string | null;
	location?: EventLocation | null;
	eventType?:
		| "community"
		| "festival"
		| "concert"
		| "fundraiser"
		| "market"
		| "workshop"
		| "other"
		| null;
	content: RichText;
	status?: "draft" | "published" | "cancelled" | "archived" | null;
	createdAt: string;
	updatedAt: string;
}

export interface EventLocation {
	venueName?: string | null;
	address?: string | null;
}

export interface LocalEventsCollectionMethods {
	/**
	 * Get local events with optional filtering
	 */
	getLocalEvents(params?: {
		limit?: number;
		page?: number;
		sort?: string;
		depth?: number;
	}): Promise<PayloadPaginatedDocs<LocalEvent>>;

	/**
	 * Get upcoming local events (events with eventDate >= today)
	 */
	getUpcomingLocalEvents(params?: {
		limit?: number;
		page?: number;
		depth?: number;
	}): Promise<PayloadPaginatedDocs<LocalEvent>>;

	/**
	 * Get local events for a specific market area (community) by ID
	 */
	getLocalEventsByMarketArea(
		marketAreaId: string,
		params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
			upcomingOnly?: boolean;
		},
	): Promise<PayloadPaginatedDocs<LocalEvent>>;

	/**
	 * Get local events for a market area by its slug
	 */
	getLocalEventsByMarketAreaSlug(
		marketAreaSlug: string,
		params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
			upcomingOnly?: boolean;
		},
	): Promise<PayloadPaginatedDocs<LocalEvent>>;

	/**
	 * Get a single local event by slug
	 */
	getLocalEventBySlug(
		slug: string,
		params?: { depth?: number },
	): Promise<LocalEvent | null>;

	/**
	 * Get a single local event by ID
	 */
	getLocalEventById(
		id: string,
		params?: { depth?: number },
	): Promise<LocalEvent | null>;
}
