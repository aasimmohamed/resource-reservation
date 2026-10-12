"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ReservationFormState = {
  errors?: Record<string, string>;
  message?: string;
  values?: Record<string, string>;
};

const Schema = z.object({
  resourceId: z.coerce.number().int().positive("Choose a resource"),
  userId: z.coerce.number().int().positive("Choose who is booking"),
  start: z.string().min(1, "Start time is required"),
  end: z.string().min(1, "End time is required"),
  purpose: z.string().trim().max(200, "Purpose is too long"),
});

const MAX_HOURS = 24;

const fmt = (d: Date) =>
  d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export async function createReservation(
  _prev: ReservationFormState,
  formData: FormData
): Promise<ReservationFormState> {
  const values = {
    resourceId: String(formData.get("resourceId") ?? ""),
    userId: String(formData.get("userId") ?? ""),
    start: String(formData.get("start") ?? ""),
    end: String(formData.get("end") ?? ""),
    purpose: String(formData.get("purpose") ?? ""),
  };

  const parsed = Schema.safeParse(values);
  const errors: Record<string, string> = {};

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!errors[key]) errors[key] = issue.message;
    }
    return { errors, values };
  }

  const d = parsed.data;
  const start = new Date(d.start);
  const end = new Date(d.end);

  if (Number.isNaN(start.getTime())) errors.start = "Invalid start time";
  if (Number.isNaN(end.getTime())) errors.end = "Invalid end time";

  if (!errors.start && !errors.end) {
    if (start < new Date()) errors.start = "Start time cannot be in the past";
    if (end <= start) errors.end = "End time must be after the start time";
    else if (end.getTime() - start.getTime() > MAX_HOURS * 3600 * 1000)
      errors.end = `A reservation cannot be longer than ${MAX_HOURS} hours`;
  }

  if (Object.keys(errors).length > 0) return { errors, values };

  const resource = await prisma.resource.findUnique({ where: { id: d.resourceId } });
  if (!resource || !resource.isActive) {
    return { errors: { resourceId: "This resource is not available" }, values };
  }

  // Layer 1: friendly conflict check
  const conflict = await prisma.reservation.findFirst({
    where: {
      resourceId: d.resourceId,
      status: "CONFIRMED",
      startTime: { lt: end },
      endTime: { gt: start },
    },
    include: { user: true },
  });
  if (conflict) {
    return {
      message: `${resource.name} is already booked from ${fmt(conflict.startTime)} to ${fmt(conflict.endTime)} (${conflict.user.name}). Please choose another time.`,
      values,
    };
  }

  // Layer 2: the database constraint catches simultaneous bookings
  try {
    await prisma.reservation.create({
      data: {
        resourceId: d.resourceId,
        userId: d.userId,
        startTime: start,
        endTime: end,
        purpose: d.purpose || null,
      },
    });
  } catch (e) {
    const text = String(e);
    if (text.includes("reservations_no_overlap") || text.includes("exclusion constraint")) {
      return {
        message: "Someone just booked this slot. Please choose another time.",
        values,
      };
    }
    console.error(e);
    return { message: "Something went wrong. Please try again.", values };
  }

  revalidatePath("/reservations");
  redirect("/reservations");
}

export async function cancelReservation(id: number) {
  await prisma.reservation.updateMany({
    where: { id, status: "CONFIRMED" },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/reservations");
}