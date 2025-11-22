import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL provider
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production with proper email setup
  },
  socialProviders: {
    // You can add social providers here (GitHub, Google, etc.)
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET,
    // },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds (5 minutes)
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      creatorRole: "owner",
      membershipLimit: 100,
      sendInvitationEmail: async (data) => {
        // TODO: Implement email sending
        console.log("Invitation email would be sent to:", data.email);
        console.log(
          "Invitation link:",
          `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`
        );
      },
    }),
    nextCookies(), // Important: this should be the last plugin
  ],
});
