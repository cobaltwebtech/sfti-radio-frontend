import {
	adminClient,
	magicLinkClient,
	phoneNumberClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
	baseURL: import.meta.env.BETTER_AUTH_BASE_URL,
	plugins: [
		magicLinkClient(),
		phoneNumberClient(),
		adminClient(),
	],
	fetchOptions: {
		onRequest(context) {
			// Ensure cookies are included in SSR requests
			return {
				...context,
				credentials: 'include',
			};
		},
	},
});

export const {
	signIn,
	signOut,
	revokeSessions,
	useSession,
	signUp,
	$Infer,
	updateUser,
	changePassword,
	resetPassword,
	requestPasswordReset,
	sendVerificationEmail,
	changeEmail,
} = authClient;
