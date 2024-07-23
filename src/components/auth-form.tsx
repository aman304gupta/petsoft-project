import React from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { logIn, signUp } from "@/actions/actions";

type AuthFormProps = {
  type: "Log In" | "Sign Up";
};

export default function AuthForm({ type }: AuthFormProps) {
  return (
    <form action={type == "Log In" ? logIn : signUp}>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" />
      </div>

      <div className="mb-4 mt-2 space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" />
      </div>

      <Button type="submit">{type}</Button>
    </form>
  );
}
