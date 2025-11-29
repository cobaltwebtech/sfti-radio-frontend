import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, captcha, magicLink, phoneNumber } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { Resend } from "resend";
import { MagicLinkEmail } from "@/components/email/MagicLinkEmail";
import { PasswordReset } from "@/components/email/PasswordReset";
import * as authSchema from "@/db/auth-schema";

// Initialize Drizzle with the Cloudflare D1 database
export const createDrizzle = (db: D1Database) =>
	drizzle(db, { schema: authSchema });

// Initialize Resend for email service
const resend = new Resend(env.RESEND_API_KEY);

// Create Better Auth instance and connect to Cloudflare D1 database
export const auth = betterAuth({
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_BASE_URL,
	database: drizzleAdapter(createDrizzle(env.DB), {
		provider: "sqlite",
	}),
	session: {
		expiresIn: 60 * 60 * 24 * 7, // Session expires in 7 days
		updateAge: 60 * 60 * 24, // Every 24 hours the session expiration is updated
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5, // Cache session data for 5 minutes
		},
	},
	rateLimit: {
		enabled: true,
	},
	advanced: {
		ipAddress: {
			// Cloudflare specific header for rate limiting
			ipAddressHeaders: ["cf-connecting-ip"],
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			try {
				await resend.emails.send({
					from: "TSFTI Radio <auth@contact.cobaltweb.tech>",
					to: user.email,
					subject: "Password Reset",
					react: await PasswordReset({
						url: url,
					}),
				});
			} catch (error) {
				console.error("Error sending password reset:", error);
				throw error;
			}
		},
	},
	plugins: [
		admin(),
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				try {
					console.log("Attempting to send magic link email to:", email);
					await resend.emails.send({
						from: "TSFTI Radio <auth@contact.cobaltweb.tech>",
						to: email,
						subject: "Login to TSFTI Radio",
						react: await MagicLinkEmail({
							url: url,
						}),
					});
					console.log("Magic link email sent successfully");
				} catch (error) {
					console.error("Error sending magic link email:", error);
					throw error;
				}
			},
		}),
		phoneNumber(),
	],
});

export type Auth = typeof auth;
