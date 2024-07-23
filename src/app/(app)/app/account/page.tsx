import ContentBlock from "@/components/content-block";
import H1 from "@/components/h1";
import React from "react";
import SignOutBtn from "@/components/sign-out-btn";
import { checkAuth } from "@/lib/server-utils";

export default async function Page() {
  //middleware will actually check if user is logged in or not
  // this is just in case + to resolve TS issues
  //if user is not logged in

  const session = await checkAuth();

  return (
    <main>
      <H1 className="my-8 text-white">Your Account</H1>

      <ContentBlock className="h-[500px] flex justify-center items-center ">
        <p>Logged in as {session.user.email}</p>

        <SignOutBtn />
      </ContentBlock>
    </main>
  );
}
