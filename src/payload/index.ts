/**
 * Payload CMS Module
 *
 * Main entry point for all Payload CMS types and utilities.
 * Import from this file for a clean API.
 *
 * @example
 * ```ts
 * import { getPayloadClient, type BlogPost, type MarketArea } from '@/payload';
 * ```
 */

// Core client and functions
export {
	createPayloadClient,
	getPayloadClient,
	type PayloadClient,
} from "./client";
// Collection types
export type {
	BlogCollectionMethods,
	// Blog
	BlogPost,
	// Churches
	Church,
	ChurchContact,
	ChurchesCollectionMethods,
	ChurchLocation,
	// Local Events
	EventLocation,
	LexicalContent,
	LocalEvent,
	LocalEventsCollectionMethods,
	// Market Areas
	MarketArea,
	MarketAreaCollectionMethods,
	// Media (shared)
	Media,
	// News
	News,
	NewsCollectionMethods,
	RichText,
	RichTextNode,
	// Schools
	School,
	SchoolContact,
	SchoolLocation,
	SchoolsCollectionMethods,
	ServiceTime,
	// Sports
	Sports,
	SportsCollectionMethods,
	SurroundingArea,
} from "./collections";
// Shared types
export type {
	CollectionQueryParams,
	PayloadClientOptions,
	PayloadPaginatedDocs,
} from "./types";
