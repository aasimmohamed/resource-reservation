"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createReservation, type ReservationFormState } from "./actions";

type Option = { id: number; name: string };

export default function ReservationForm({
  resources,
  users,
  defaultResourceId,
}: {
  resources: Option[];
  users: Option[];
  defaultResourceId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createReservation,
    {} as ReservationFormState
  );
  const err = state.errors ?? {};
  const v = state.values ?? {};

  const input = "w-full rounded border border-gray-300 p-2 text-sm";
  const errorText = "mt-1 text-xs text-red-600";

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Resource *</label>
        <select
          name="resourceId"
          defaultValue={v.resourceId ?? defaultResourceId ?? ""}
          className={input}
        >
          <option value="">Select a resource</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {err.resourceId && <p className={errorText}>{err.resourceId}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Booked by *</label>
        <select name="userId" defaultValue={v.userId ?? ""} className={input}>
          <option value="">Select a user</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        {err.userId && <p className={errorText}>{err.userId}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Start *</label>
          <input
            type="datetime-local"
            name="start"
            defaultValue={v.start ?? ""}
            className={input}
          />
          {err.start && <p className={errorText}>{err.start}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">End *</label>
          <input
            type="datetime-local"
            name="end"
            defaultValue={v.end ?? ""}
            className={input}
          />
          {err.end && <p className={errorText}>{err.end}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Purpose</label>
        <input name="purpose" defaultValue={v.purpose ?? ""} className={input} />
        {err.purpose && <p className={errorText}>{err.purpose}</p>}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Booking..." : "Book resource"}
        </button>
        <Link href="/reservations" className="rounded border px-4 py-2 text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}