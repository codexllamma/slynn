import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const allowedEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase());

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const inputEmail = credentials.email.trim().toLowerCase();
        const inputPassword = credentials.password;

        const isEmailAllowed = allowedEmails.includes(inputEmail);
        const isPasswordCorrect = inputPassword === process.env.ADMIN_PASSWORD;

        if (isEmailAllowed && isPasswordCorrect) {
          return {
            id: inputEmail,
            name: "Admin",
            email: inputEmail,
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
