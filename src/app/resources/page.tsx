import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { toneFor } from "@/lib/theme";
import { toggleResourceActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await prisma.resource.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <PageHeader title="Resources" subtitle="Rooms, vehicles and equipment people can book.">
        <Link href="/resources/new" className="btn-primary">
          Add resource
        </Link>
      </PageHeader>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-indigo-50 text-indigo-900">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Location</th>
              <th className="p-3">Capacity</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-indigo-50 ${r.isActive ? "" : "text-slate-400"}`}
              >
                <td className="p-3 font-semibold">{r.name}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r.isActive ? toneFor(r.type).chip : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {r.type}
                  </span>
                </td>
                <td className="p-3">{r.location ?? "-"}</td>
                <td className="p-3">{r.capacity ?? "-"}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-4">
                    <Link href={`/resources/${r.id}/edit`} className="font-semibold text-indigo-600">
                      Edit
                    </Link>
                    <form action={toggleResourceActive.bind(null, r.id)}>
                      <button type="submit" className="font-semibold text-slate-500 hover:text-rose-600">
                        {r.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}