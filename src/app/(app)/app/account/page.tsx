import ContentBlock from "@/components/content-block";
import H1 from "@/components/h1";
import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutBtn from "@/components/sign-out-btn";

export default async function Page() {
  const session = await auth();

  //middleware will actually check if user is logged in or not
  // this is just in case + to resolve TS issues
  //if user is not logged in
  if (!session?.user) {
    redirect("/login"); //redirect to login page
  }

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
