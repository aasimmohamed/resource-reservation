import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cancelReservation } from "./actions";

export const dynamic = "force-dynamic";

const fmt = (d: Date) =>
  d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function ReservationsPage() {
  const now = new Date();

  const [upcoming, history] = await Promise.all([
    prisma.reservation.findMany({
      where: { status: "CONFIRMED", endTime: { gte: now } },
      include: { resource: true, user: true },
      orderBy: { startTime: "asc" },
      take: 100,
    }),
    prisma.reservation.findMany({
      where: { OR: [{ status: "CANCELLED" }, { endTime: { lt: now } }] },
      include: { resource: true, user: true },
      orderBy: { startTime: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-10 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reservations</h1>
        <Link
          href="/reservations/new"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          Book a resource
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Upcoming</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">Resource</th>
                <th className="p-3">Booked by</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Purpose</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 text-gray-500">
                    No upcoming reservations.
                  </td>
                </tr>
              )}
              {upcoming.map((r) => (
                <tr key={r.id} className="border-t border-gray-200">
                  <td className="p-3 font-medium">{r.resource.name}</td>
                  <td className="p-3">{r.user.name}</td>
                  <td className="p-3">{fmt(r.startTime)}</td>
                  <td className="p-3">{fmt(r.endTime)}</td>
                  <td className="p-3">{r.purpose ?? "-"}</td>
                  <td className="p-3">
                    <form action={cancelReservation.bind(null, r.id)}>
                      <button type="submit" className="text-red-600 underline">
                        Cancel
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Past and cancelled</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500">Nothing here yet.</td>
                </tr>
              )}
              {history.map((r) => (
                <tr key={r.id} className="border-t border-gray-200 text-gray-600">
                  <td className="p-3">{r.resource.name}</td>
                  <td className="p-3">{r.user.name}</td>
                  <td className="p-3">{fmt(r.startTime)}</td>
                  <td className="p-3">{fmt(r.endTime)}</td>
                  <td className="p-3">
                    {r.status === "CANCELLED" ? "Cancelled" : "Completed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}