"use client";

import { createCheckoutSession } from "@/actions/actions";
import H1 from "@/components/h1";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";

export default function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }; //documentation
}) {
  const [isPending, startTransition] = useTransition();
  //session -> session object from next-auth (we are are creating usung session hook)
  const { data: session, update, status } = useSession();
  const router = useRouter();

  return (
    <main className="flex flex-col items-center space-y-10">
      <H1>PetSoft access requires payment</H1>

      {searchParams.success && (
        <Button
          disabled={status === "loading" || session?.user.hasAccess}
          onClick={async () => {
            await update(true); //req to BE to update token
            router.push("/app/dashboard"); //client side routing
          }}
        >
          Access PetSoft
        </Button>
      )}

      {!searchParams.success && (
        <Button
          disabled={isPending}
          onClick={async () => {
            //start transition

            startTransition(async () => {
              //create checkout session
              await createCheckoutSession();
            });
          }}
        >
          Buy lifetime access for $299
        </Button>
      )}
      {
        //if payment is successfull
        searchParams.success && (
          <p className="text-sm text-green-700">
            Payment successfull! You have lifetime access to PetSoft
          </p>
        )
      }
      {
        //if payment is failed
        searchParams.cancelled && (
          <p className="text-sm text-red-700">
            Payment failed! Please try again
          </p>
        )
      }
    </main>
  );
}
