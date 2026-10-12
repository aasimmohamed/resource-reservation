import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { toneFor } from "@/lib/theme";
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
    <main className="mx-auto max-w-5xl space-y-10 p-6 sm:p-8">
      <PageHeader title="Reservations" subtitle="Everything that is booked, and what has passed.">
        <Link href="/reservations/new" className="btn-primary">
          Book a resource
        </Link>
      </PageHeader>

      <section>
        <h2 className="mb-3 text-xl">Upcoming</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-indigo-50 text-indigo-900">
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
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No upcoming reservations. Use Book a resource to add one.
                  </td>
                </tr>
              )}
              {upcoming.map((r) => (
                <tr key={r.id} className="border-t border-indigo-50">
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneFor(r.resource.type).chip}`}
                    >
                      {r.resource.name}
                    </span>
                  </td>
                  <td className="p-3">{r.user.name}</td>
                  <td className="p-3">{fmt(r.startTime)}</td>
                  <td className="p-3">{fmt(r.endTime)}</td>
                  <td className="p-3">{r.purpose ?? "-"}</td>
                  <td className="p-3">
                    <form action={cancelReservation.bind(null, r.id)}>
                      <button type="submit" className="font-semibold text-rose-600 hover:underline">
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
        <h2 className="mb-3 text-xl">Past and cancelled</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm text-slate-500">
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td className="p-6 text-center">Nothing here yet.</td>
                </tr>
              )}
              {history.map((r) => (
                <tr key={r.id} className="border-t border-indigo-50 first:border-t-0">
                  <td className="p-3">{r.resource.name}</td>
                  <td className="p-3">{r.user.name}</td>
                  <td className="p-3">{fmt(r.startTime)}</td>
                  <td className="p-3">{fmt(r.endTime)}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        r.status === "CANCELLED"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {r.status === "CANCELLED" ? "Cancelled" : "Completed"}
                    </span>
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