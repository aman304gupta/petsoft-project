"use client";

import React from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { logIn, signUp } from "@/actions/actions";
import AuthFormBtn from "./auth-form-btn";
import { useFormState } from "react-dom";

type AuthFormProps = {
  type: "Log In" | "Sign Up";
};

export default function AuthForm({ type }: AuthFormProps) {
  //returns the error message from the server and dispatch action
  //takes function and initial state
  const [signUpError, dispatchSignUp] = useFormState(signUp, undefined);
  const [logInError, dispatchLogIn] = useFormState(logIn, undefined);

  return (
    <form action={type === "Log In" ? dispatchLogIn : dispatchSignUp}>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div className="mb-4 mt-2 space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>

      <AuthFormBtn type={type} />

      {signUpError && (
        <p className="text-red-500 text-sm mt-2">{signUpError.message}</p>
      )}

      {logInError && (
        <p className="text-red-500 text-sm mt-2">{logInError.message}</p>
      )}
    </form>
  );
}
