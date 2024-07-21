import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "./db";
import bcrypt from "bcryptjs";

const config = {
  pages: {
    // Custom pages
    signIn: "/login",
  },
  //by default JWT is used for sessions
  //types of ways to login
  providers: [
    Credentials({
      //runs on every login attempt
      async authorize(credentials) {
        const { email, password } = credentials;

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user) {
          console.log("User not found");
          return null;
        }

        //check if password is correct
        const passwordsMatch = await bcrypt.compare(
          password as string,
          user.hashedPassword
        );

        if (!passwordsMatch) {
          console.log("Password incorrect");
          return null;
        }

        //user is there and password is correct

        return user;
      },
    }),
  ],
  //
  callbacks: {
    authorized: ({ auth, request }) => {
      //runs on every request with middleware
      const isLoggedIn = Boolean(auth?.user); //if user is logged in

      const isTryingToAccessApp = request.nextUrl.pathname.includes("/app");

      //not logged in and trying to access app
      if (!isLoggedIn && isTryingToAccessApp) {
        return false;
      }

      //logged in and trying to access app page
      if (isLoggedIn && isTryingToAccessApp) {
        return true;
      }

      //if user is logged and accessing non-app page --> redirect to app page
      if (isLoggedIn && !isTryingToAccessApp) {
        return Response.redirect(new URL("/app/dashboard", request.nextUrl));
      }

      if (!isLoggedIn && !isTryingToAccessApp) {
        return true;
      }

      return false;
    },
  },
} satisfies NextAuthConfig;

export const { auth, signIn, signOut } = NextAuth(config);
//signOut removes the session cookie - can only be called on server action
