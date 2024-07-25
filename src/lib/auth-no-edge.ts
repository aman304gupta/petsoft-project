import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";
import { getUserByEmail } from "./server-utils";
import { authSchema } from "@/lib/validations";
import { sleep } from "./utils";
import { nextAuthEdgeConfig } from "./auth-edge";

const config = {
  ...nextAuthEdgeConfig,
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

        const user = await getUserByEmail(email);

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
  ], //this will override the provider from nextAuthEdgeConfig
} satisfies NextAuthConfig;

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(config);
//signOut removes the session cookie - can only be called on server action
