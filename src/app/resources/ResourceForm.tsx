"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "./actions";

type Defaults = {
  name?: string;
  type?: string;
  location?: string | null;
  capacity?: number | null;
  description?: string | null;
};

export default function ResourceForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const err = state.errors ?? {};

  const input = "w-full rounded border border-gray-300 p-2 text-sm";
  const errorText = "mt-1 text-xs text-red-600";

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Name *</label>
        <input name="name" defaultValue={defaults.name ?? ""} className={input} />
        {err.name && <p className={errorText}>{err.name}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Type *</label>
        <input
          name="type"
          defaultValue={defaults.type ?? ""}
          placeholder="Meeting Room, Vehicle, Equipment..."
          className={input}
        />
        {err.type && <p className={errorText}>{err.type}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Location</label>
        <input name="location" defaultValue={defaults.location ?? ""} className={input} />
        {err.location && <p className={errorText}>{err.location}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Capacity</label>
        <input
          name="capacity"
          defaultValue={defaults.capacity ?? ""}
          inputMode="numeric"
          className={input}
        />
        {err.capacity && <p className={errorText}>{err.capacity}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          name="description"
          defaultValue={defaults.description ?? ""}
          rows={3}
          className={input}
        />
        {err.description && <p className={errorText}>{err.description}</p>}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        <Link href="/resources" className="rounded border px-4 py-2 text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}