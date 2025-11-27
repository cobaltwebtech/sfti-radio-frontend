// Re-export all schema tables for Drizzle
export * from './auth-schema';

// Organized exports for better imports in your app
import * as authSchema from './auth-schema';

// Export organized schema groups
export const schemas = {
	auth: authSchema,
};

// Export all tables for database connection
export const allTables = {
	// Auth tables
	...authSchema,
};
