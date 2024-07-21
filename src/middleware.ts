// import { NextResponse } from "next/server";

import { auth } from "./lib/auth";

// export default function middleware(request: Request) {
//   console.log(request.url, "middleware");

//   return NextResponse.next();
// }

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
