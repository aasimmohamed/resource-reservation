import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { toneFor } from "@/lib/theme";

export const dynamic = "force-dynamic";

const START_H = 7;
const END_H = 21;
const ticks = Array.from({ length: (END_H - START_H) / 2 + 1 }, (_, i) => START_H + i * 2);

const timeFmt = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseDate(input?: string): Date {
  const d = input && /^\d{4}-\d{2}-\d{2}$/.test(input) ? new Date(`${input}T00:00:00`) : new Date();
  if (Number.isNaN(d.getTime())) return startOfDay(new Date());
  return startOfDay(d);
}

function toInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const dayStart = parseDate(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const prev = new Date(dayStart);
  prev.setDate(prev.getDate() - 1);

  const winStart = new Date(dayStart);
  winStart.setHours(START_H, 0, 0, 0);
  const winEnd = new Date(dayStart);
  winEnd.setHours(END_H, 0, 0, 0);
  const span = winEnd.getTime() - winStart.getTime();

  const resources = await prisma.resource.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      reservations: {
        where: { status: "CONFIRMED", startTime: { lt: dayEnd }, endTime: { gt: dayStart } },
        include: { user: true },
        orderBy: { startTime: "asc" },
      },
    },
  });

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <PageHeader
        title="Availability"
        subtitle={dayStart.toLocaleDateString("en-GB", { dateStyle: "full" })}
      >
        <Link href={`/availability?date=${toInputValue(prev)}`} className="btn-secondary">
          Previous
        </Link>
        <Link href="/availability" className="btn-secondary">
          Today
        </Link>
        <Link href={`/availability?date=${toInputValue(dayEnd)}`} className="btn-secondary">
          Next
        </Link>
        <form action="/availability" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={toInputValue(dayStart)}
            className="input input-inline"
          />
          <button type="submit" className="btn-secondary">
            Go
          </button>
        </form>
      </PageHeader>

      <div className="space-y-4">
        {resources.map((r) => {
          const tone = toneFor(r.type);
          return (
            <div key={r.id} className="card min-w-0 p-3 sm:p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3 sm:items-center">
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.chip}`}>
                    {r.type}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base">{r.name}</h2>
                    {r.location && <p className="text-xs text-slate-500">{r.location}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  {r.reservations.length === 0 && (
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Free all day
                    </span>
                  )}
                  <Link href={`/reservations/new?resourceId=${r.id}`} className="btn-primary">
                    Book
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[34rem] sm:min-w-0">
                  <div className="relative h-10 overflow-hidden rounded-lg bg-slate-100">
                    {ticks.map((h) => (
                    <div
                        key={h}
                        className="absolute bottom-0 top-0 w-px bg-slate-200"
                        style={{ left: `${((h - START_H) / (END_H - START_H)) * 100}%` }}
                      />
                    ))}
                    {r.reservations.map((b) => {
                      const left = clamp(((b.startTime.getTime() - winStart.getTime()) / span) * 100);
                      const right = clamp(((b.endTime.getTime() - winStart.getTime()) / span) * 100);
                      if (right - left <= 0) return null;
                      return (
                        <div
                          key={b.id}
                          title={`${timeFmt(b.startTime)} to ${timeFmt(b.endTime)}, ${b.user.name}${b.purpose ? `, ${b.purpose}` : ""}`}
                          className={`absolute bottom-1 top-1 overflow-hidden whitespace-nowrap rounded-md px-2 text-xs font-semibold leading-8 text-white ${tone.block}`}
                          style={{ left: `${left}%`, width: `${right - left}%` }}
                        >
                          {b.user.name}
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative mt-1 h-4 text-[11px] text-slate-400">
                    {ticks.map((h) => (
                      <span
                        key={h}
                        className={`absolute ${h === START_H ? "translate-x-0" : h === END_H ? "-translate-x-full" : "-translate-x-1/2"}`}
                        style={{ left: `${((h - START_H) / (END_H - START_H)) * 100}%` }}
                      >
                        {String(h).padStart(2, "0")}:00
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {r.reservations.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                  {r.reservations.map((b) => (
                    <li key={b.id} className={`rounded-full px-3 py-1 font-medium ${tone.chip}`}>
                      {timeFmt(b.startTime)} to {timeFmt(b.endTime)}, {b.user.name}
                      {b.purpose ? `: ${b.purpose}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}