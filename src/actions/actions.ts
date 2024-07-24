"use server";
import prisma from "@/lib/db";
import { sleep } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { authSchema, petFormSchema, petIdSchema } from "@/lib/validations";
import { signIn, signOut } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { checkAuth, getPetById } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";

// -- User actions --

//formadata from auth-form.tsx
//type has to be unknown --> anyone can call this login, so we have to assume unknow type
//prevState -> because using useFormState in FE --> react returns previous state
export async function logIn(prevState: unknown, formData: unknown) {
  await sleep(1000);

  //check if formData is of type FormData
  if (!(formData instanceof FormData)) {
    return {
      message: "Invalid form data",
    };
  }

  try {
    await signIn("credentials", formData);
    //sign from NextAuth will automatically
    //run redirect -> and redirect to page where it's called i.e login
    //But redirect throws error in NextJs?
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin": {
          return {
            message: "Invalid email or password",
          };
        }
        default: {
          return {
            message: "Error : Failed to sign in",
          };
        }
      }
    }

    throw error;
    //nextjs redirect throws error
    //so we rethrow it
  }
}

export async function logOut() {
  await sleep(1000);

  await signOut({
    redirectTo: "/",
  });
}

//Server can't rely on client side validation
//so we assume formData is of type unknown and validate it here
export async function signUp(prevState: unknown, formData: unknown) {
  await sleep(1000);

  //check if formData is of type FormData
  if (!(formData instanceof FormData)) {
    return {
      message: "Invalid form data",
    };
  }

  //Convert formData to plain object
  const formDataEntries = Object.fromEntries(formData.entries());

  //actual validations
  const validatedFormData = authSchema.safeParse(formDataEntries);

  if (!validatedFormData.success) {
    return {
      message: "Invalid form data",
    };
  }

  //now we know formdata has email and password
  const { email, password } = validatedFormData.data;

  //hash password to store in DB
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    //user created in DB
    await prisma.user.create({
      data: {
        email,
        hashedPassword,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          message: "Email already in use",
        };
      }
    }

    return {
      message: "Failed to create user",
    };
  }

  //then using NextAuth signIn method to sign in user which will then redirect to app page
  //Credentials expects formData Not validatedFormData, credentials does validation itself
  await signIn("credentials", formData);
}

// -- Pet actions --

export async function addPet(pet: unknown) {
  await sleep(1000);

  const session = await checkAuth();

  const validatedPet = petFormSchema.safeParse(pet);

  if (!validatedPet.success) {
    return {
      message: "Invalid pet data",
    };
  }

  try {
    await prisma.pet.create({
      data: {
        ...validatedPet.data,
        user: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });
  } catch (error) {
    return {
      message: "Failed to add pet",
    };
  }

  revalidatePath("/app", "layout");
}

export async function editPet(petId: unknown, newPetData: unknown) {
  await sleep(1000);

  //authentication check -> i.e their token is valid
  const session = await checkAuth();

  //validation
  const validatedPet = petFormSchema.safeParse(newPetData);
  const validatedPetId = petIdSchema.safeParse(petId);

  if (!validatedPet.success || !validatedPetId.success) {
    return {
      message: "Invalid pet data",
    };
  }

  //authorization check -> i.e user is authorized to edit this pet
  const pet = await prisma.pet.findUnique({
    where: {
      id: validatedPetId.data,
    },
  });

  if (!pet) {
    return {
      message: "Pet not found",
    };
  }

  if (pet.userId !== session.user.id) {
    return {
      message: "Unauthorized",
    };
  }

  //database mutation
  try {
    await prisma.pet.update({
      where: {
        id: validatedPetId.data,
      },
      data: validatedPet.data,
    });
  } catch (error) {
    return {
      message: "Failed to edit pet",
    };
  }

  revalidatePath("/app", "layout");
}

export async function deletePet(petId: unknown) {
  await sleep(1000);

  //authentication check -> i.e their token is valid
  const session = await checkAuth();

  //validate petId
  const validatedPetId = petIdSchema.safeParse(petId);

  if (!validatedPetId.success) {
    return {
      message: "Invalid pet data",
    };
  }

  //authorization check -> i.e user is authorized to delete this pet
  const pet = await getPetById(validatedPetId.data);

  if (!pet) {
    return {
      message: "Pet not found",
    };
  }

  if (pet.userId !== session.user.id) {
    return {
      message: "Unauthorized",
    };
  }

  //database mutation
  try {
    await prisma.pet.delete({
      where: {
        id: validatedPetId.data,
      },
    });
  } catch (error) {
    return {
      message: "Failed to delete pet",
    };
  }

  revalidatePath("/app", "layout");
}
