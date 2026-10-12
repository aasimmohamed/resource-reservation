import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const HOUR = 3600 * 1000;
const HOURS_PER_DAY = 10; // assumption: 10 bookable hours per day

const timeFmt = (d: Date) =>
  d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// Hours of a booking that fall inside the window [from, to)
function overlapHours(start: Date, end: Date, from: Date, to: Date) {
  const s = Math.max(start.getTime(), from.getTime());
  const e = Math.min(end.getTime(), to.getTime());
  return Math.max(0, e - s) / HOUR;
}

function utilization(hours: number, days: number) {
  return Math.min(100, Math.round((hours / (days * HOURS_PER_DAY)) * 100));
}

export default async function DashboardPage() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = addDays(today, 1);
  const pastFrom = addDays(today, -30);
  const nextTo = addDays(today, 7);

  const [resources, reservations, upcomingCount, nextUp] = await Promise.all([
    prisma.resource.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.reservation.findMany({
      where: {
        status: "CONFIRMED",
        startTime: { lt: nextTo },
        endTime: { gt: pastFrom },
      },
      select: { resourceId: true, startTime: true, endTime: true },
    }),
    prisma.reservation.count({
      where: { status: "CONFIRMED", endTime: { gte: now } },
    }),
    prisma.reservation.findMany({
      where: { status: "CONFIRMED", endTime: { gte: now } },
      include: { resource: true, user: true },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
  ]);

  const activeIds = new Set(resources.map((r) => r.id));
  const bookingsToday = reservations.filter(
    (b) => activeIds.has(b.resourceId) && overlapHours(b.startTime, b.endTime, today, tomorrow) > 0
  ).length;

  const rows = resources.map((r) => {
    const mine = reservations.filter((b) => b.resourceId === r.id);
    const pastHours = mine.reduce((s, b) => s + overlapHours(b.startTime, b.endTime, pastFrom, today), 0);
    const nextHours = mine.reduce((s, b) => s + overlapHours(b.startTime, b.endTime, today, nextTo), 0);
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      pastCount: mine.filter((b) => overlapHours(b.startTime, b.endTime, pastFrom, today) > 0).length,
      pastHours,
      pastUtil: utilization(pastHours, 30),
      nextCount: mine.filter((b) => overlapHours(b.startTime, b.endTime, today, nextTo) > 0).length,
      nextHours,
      nextUtil: utilization(nextHours, 7),
    };
  });

  const cards = [
    { label: "Active resources", value: resources.length },
    { label: "Bookings today", value: bookingsToday },
    { label: "Upcoming bookings", value: upcomingCount },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-10 p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Resource usage</h2>
        <p className="mb-3 text-xs text-gray-500">
          Utilization = booked hours divided by {HOURS_PER_DAY} bookable hours per day.
        </p>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">Resource</th>
                <th className="p-3">Last 30 days</th>
                <th className="p-3">Next 7 days</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-200">
                  <td className="p-3">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.type}</p>
                  </td>
                  {[
                    { count: r.pastCount, hours: r.pastHours, util: r.pastUtil },
                    { count: r.nextCount, hours: r.nextHours, util: r.nextUtil },
                  ].map((c, i) => (
                    <td key={i} className="p-3">
                      <p>
                        {c.count} bookings · {c.hours.toFixed(1)} h · {c.util}%
                      </p>
                      <div className="mt-1 h-2 w-40 rounded bg-gray-100">
                        <div className="h-2 rounded bg-black" style={{ width: `${c.util}%` }} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Next up</h2>
          <Link href="/reservations/new" className="rounded bg-black px-3 py-1 text-xs text-white">
            Book a resource
          </Link>
        </div>
        {nextUp.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming reservations.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {nextUp.map((b) => (
              <li key={b.id} className="rounded border border-gray-200 p-3">
                <span className="font-medium">{b.resource.name}</span> · {timeFmt(b.startTime)} to{" "}
                {timeFmt(b.endTime)} · {b.user.name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}