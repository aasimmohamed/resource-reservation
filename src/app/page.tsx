import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { toneFor } from "@/lib/theme";

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
      where: { status: "CONFIRMED", startTime: { lt: nextTo }, endTime: { gt: pastFrom } },
      select: { resourceId: true, startTime: true, endTime: true },
    }),
    prisma.reservation.count({ where: { status: "CONFIRMED", endTime: { gte: now } } }),
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
    { label: "Active resources", value: resources.length, cls: "bg-indigo-600" },
    { label: "Bookings today", value: bookingsToday, cls: "bg-emerald-600" },
    { label: "Upcoming bookings", value: upcomingCount, cls: "bg-fuchsia-600" },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-10 p-6 sm:p-8">
      <PageHeader
        title="Dashboard"
        subtitle={now.toLocaleDateString("en-GB", { dateStyle: "full" })}
      >
        <Link href="/reservations/new" className="btn-primary">
          Book a resource
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl p-5 text-white shadow-lg ${c.cls}`}>
            <p className="text-sm font-medium text-white/80">{c.label}</p>
            <p className="mt-1 text-4xl font-extrabold">{c.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-xl">Resource usage</h2>
        <p className="mb-4 mt-1 text-xs text-slate-500">
          Utilization is booked hours divided by {HOURS_PER_DAY} bookable hours per day.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((r) => {
            const tone = toneFor(r.type);
            return (
              <div key={r.id} className="card overflow-hidden">
                <div className={`h-1.5 ${tone.bar}`} />
                <div className="space-y-4 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{r.name}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.chip}`}>
                      {r.type}
                    </span>
                  </div>
                  {[
                    { label: "Last 30 days", count: r.pastCount, hours: r.pastHours, util: r.pastUtil },
                    { label: "Next 7 days", count: r.nextCount, hours: r.nextHours, util: r.nextUtil },
                  ].map((p) => (
                    <div key={p.label}>
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>
                          {p.label}: {p.count} bookings, {p.hours.toFixed(1)} h
                        </span>
                        <span className="font-bold text-slate-700">{p.util}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${tone.bar}`} style={{ width: `${p.util}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl">Next up</h2>
        {nextUp.length === 0 ? (
          <div className="card p-6 text-sm text-slate-500">
            Nothing is booked yet.{" "}
            <Link href="/reservations/new" className="font-semibold text-indigo-600">
              Book the first resource
            </Link>
            .
          </div>
        ) : (
          <ul className="space-y-2">
            {nextUp.map((b) => (
              <li key={b.id} className="card flex items-center gap-3 p-3 text-sm">
                <span className={`h-10 w-1.5 rounded-full ${toneFor(b.resource.type).bar}`} />
                <div>
                  <p className="font-semibold">{b.resource.name}</p>
                  <p className="text-slate-500">
                    {timeFmt(b.startTime)} to {timeFmt(b.endTime)}, {b.user.name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}