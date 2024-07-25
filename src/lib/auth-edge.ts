import { NextAuthConfig } from "next-auth";

import prisma from "./db";

export const nextAuthEdgeConfig = {
  pages: {
    // Custom pages
    signIn: "/login",
  },
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
          return Response.redirect(new URL("/payment", request.nextUrl));
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
        // const userFromDb = await getUserByEmail(token.email); //updated user info

        const userFromDb = await prisma.user.findUnique({
          where: {
            email: token.email,
          },
        });

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
  providers: [], //jsut to satisfy the type
} satisfies NextAuthConfig;
