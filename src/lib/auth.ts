import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";
import { getUserByEmail } from "./server-utils";
import { authSchema } from "@/lib/validations";
import { sleep } from "./utils";
import { NextResponse } from "next/server";

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
        console.log("Credentials", credentials);

        // console.log("Credentials formData", credentials.formData);

        //validate the object -> i,e if it has email and password
        const validatedFormData = authSchema.safeParse(credentials);

        console.log("Validated form data", validatedFormData);

        if (!validatedFormData.success) {
          return null;
        }

        //extract values
        const { email, password } = validatedFormData.data;

        console.log("Email and password", email, password);

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
        return user;
        // NextAuth issue -> user has id, but NextAuth doesn't sends id to session
        //it only sends email
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

      //logged in and trying to access app page and does NOT has access
      if (isLoggedIn && isTryingToAccessApp && !auth?.user.hasAccess) {
        //redirect to payment page
        console.log("Redirecting to payment page");
        return Response.redirect(new URL("/payment", request.nextUrl));
      }

      //logged in and trying to access app page and has access
      if (isLoggedIn && isTryingToAccessApp && auth?.user.hasAccess) {
        return true;
      }

      //if user is logged in and trying to access login or signup page
      //and has access then redirect to dashboard
      if (
        isLoggedIn &&
        (request.nextUrl.pathname.includes("/login") ||
          request.nextUrl.pathname.includes("/signup")) &&
        auth?.user.hasAccess
      ) {
        //redirect to dashboard page
        console.log("Redirecting to App dashboard page");
        return Response.redirect(new URL("/app/dashboard", request.nextUrl));
      }

      //if user is logged and accessing non-app page --> redirect to payment page
      if (isLoggedIn && !isTryingToAccessApp) {
        //if user is logged in and trying to access login or signup page
        if (
          (request.nextUrl.pathname.includes("/login") ||
            request.nextUrl.pathname.includes("/signup")) &&
          !auth?.user.hasAccess //doesn not have access
        ) {
          //redirect to payment page
          console.log("Redirecting to payment page");
          return NextResponse.redirect(new URL("/payment", request.nextUrl));
        }

        //if user is logged in and trying to access non-app page -> allowed so true
        //eg -> if accessing /payment -> no redirect
        return true;
      }

      if (!isLoggedIn && !isTryingToAccessApp) {
        //public part
        return true;
      }

      return false;
    },
    //callback fxn when JSON web token is created
    jwt: async ({ token, user, trigger }) => {
      //user we get from Credentials provider
      // i.e user object is only available when user is logged in
      if (user) {
        //on sign in
        token.userId = user.id;
        token.email = user.email!; //hack, that email is always there and not undefined
        token.hasAccess = user.hasAccess;
      }

      if (trigger === "update") {
        // await sleep(1000);
        //get latest data from DB
        //we cannot get from user --> because user info from token might not be updated
        const userFromDb = await getUserByEmail(token.email); //updated user info

        if (userFromDb) {
          token.hasAccess = userFromDb.hasAccess;
        }
      }

      return token;
    },
    session: ({ session, token }) => {
      //session object is available on every request
      //token is the object we get from jwt callback

      //user is logged in
      session.user.id = token.userId;
      session.user.hasAccess = token.hasAccess;

      //don;t expose pass!!

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
