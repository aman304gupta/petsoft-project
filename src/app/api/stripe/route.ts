import prisma from "@/lib/db";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

//STRIPE will send a POST req to /api/stripe
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  //verify the webhook is from STRIPE
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.log("Webhook verification failed", error);
    return Response.json(null, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": //if event is for payment success
      //fulfill the order
      await prisma.user.update({
        where: {
          email: event.data.object.customer_email,
        },
        data: {
          hasAccess: true,
        },
      });
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  //return 200 OK

  return Response.json(null, { status: 200 });
}
