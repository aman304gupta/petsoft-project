import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";
import { getUserByEmail } from "./server-utils";
import { authSchema } from "@/lib/validations";

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
      //credentials type is fixed by NextAuth
      async authorize(credentials) {
        //validate the object -> i,e if it has email and password
        const validatedFormData = authSchema.safeParse(credentials);

        if (!validatedFormData.success) {
          return null;
        }

        //extract values
        const { email, password } = validatedFormData.data;

        const user = await getUserByEmail(email as string);

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
        return user; // NextAuth issue -> user has id, but NextAuth doesn't sends id to session
      },
    }),
  ],
  //
  callbacks: {
    //runs on every request with middleware
    authorized: ({ auth, request }) => {
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
    //callback fxn when JSON web token is created
    jwt: ({ token, user }) => {
      //user we get from Credentials provider
      // i.e user object is only available when user is logged in
      if (user) {
        //on sign in
        token.userId = user.id;
      }

      return token;
    },
    session: ({ session, token }) => {
      //session object is available on every request
      //token is the object we get from jwt callback

      if (session.user) {
        //user is logged in
        session.user.id = token.userId;
      }

      return session; //this session object is exposed to client
    },
  },
} satisfies NextAuthConfig;

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(config);
//signOut removes the session cookie - can only be called on server action
