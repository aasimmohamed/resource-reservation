import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleResourceActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await prisma.resource.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resources</h1>
        <Link
          href="/resources/new"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          Add resource
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
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
              <tr key={r.id} className="border-t border-gray-200">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{r.type}</td>
                <td className="p-3">{r.location ?? "-"}</td>
                <td className="p-3">{r.capacity ?? "-"}</td>
                <td className="p-3">{r.isActive ? "Active" : "Inactive"}</td>
                <td className="flex gap-3 p-3">
                  <Link href={`/resources/${r.id}/edit`} className="text-blue-600">
                    Edit
                  </Link>
                  <form action={toggleResourceActive.bind(null, r.id)}>
                    <button type="submit" className="text-gray-600 underline">
                      {r.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}