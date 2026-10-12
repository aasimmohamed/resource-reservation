"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type FormState = { errors?: Record<string, string>; message?: string };

const ResourceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  type: z.string().trim().min(1, "Type is required").max(50, "Type is too long"),
  location: z.string().trim().max(100, "Location is too long"),
  description: z.string().trim().max(500, "Description is too long"),
  capacity: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 10000),
      "Capacity must be a whole number from 1 to 10000"
    ),
});

function parseForm(formData: FormData) {
  const raw = {
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? ""),
    location: String(formData.get("location") ?? ""),
    description: String(formData.get("description") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
  };
  const result = ResourceSchema.safeParse(raw);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!errors[key]) errors[key] = issue.message;
    }
    return { errors } as const;
  }
  const d = result.data;
  return {
    data: {
      name: d.name,
      type: d.type,
      location: d.location || null,
      description: d.description || null,
      capacity: d.capacity ? Number(d.capacity) : null,
    },
  } as const;
}

function handleDbError(e: unknown): FormState {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return { errors: { name: "A resource with this name already exists" } };
  }
  console.error(e);
  return { message: "Something went wrong. Please try again." };
}

export async function createResource(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseForm(formData);
  if ("errors" in parsed) return { errors: parsed.errors };

  try {
    await prisma.resource.create({ data: parsed.data });
  } catch (e) {
    return handleDbError(e);
  }

  revalidatePath("/resources");
  redirect("/resources");
}

export async function updateResource(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseForm(formData);
  if ("errors" in parsed) return { errors: parsed.errors };

  try {
    await prisma.resource.update({ where: { id }, data: parsed.data });
  } catch (e) {
    return handleDbError(e);
  }

  revalidatePath("/resources");
  redirect("/resources");
}

export async function toggleResourceActive(id: number) {
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) return;
  await prisma.resource.update({
    where: { id },
    data: { isActive: !resource.isActive },
  });
  revalidatePath("/resources");
}