import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const timeFmt = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function parseDate(input?: string): Date {
  const d = input && /^\d{4}-\d{2}-\d{2}$/.test(input) ? new Date(`${input}T00:00:00`) : new Date();
  if (Number.isNaN(d.getTime())) return startOfDay(new Date());
  return startOfDay(d);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

  const resources = await prisma.resource.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      reservations: {
        where: {
          status: "CONFIRMED",
          startTime: { lt: dayEnd },
          endTime: { gt: dayStart },
        },
        include: { user: true },
        orderBy: { startTime: "asc" },
      },
    },
  });

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Availability on {dayStart.toLocaleDateString("en-GB", { dateStyle: "full" })}
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/availability?date=${toInputValue(prev)}`} className="rounded border px-3 py-1">
            Previous
          </Link>
          <Link href="/availability" className="rounded border px-3 py-1">
            Today
          </Link>
          <Link href={`/availability?date=${toInputValue(dayEnd)}`} className="rounded border px-3 py-1">
            Next
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {resources.map((r) => (
          <div key={r.id} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{r.name}</h2>
                <p className="text-xs text-gray-500">
                  {r.type}
                  {r.location ? ` · ${r.location}` : ""}
                </p>
              </div>
              <Link
                href={`/reservations/new?resourceId=${r.id}`}
                className="rounded bg-black px-3 py-1 text-xs text-white"
              >
                Book
              </Link>
            </div>

            {r.reservations.length === 0 ? (
              <p className="text-sm text-green-700">Free all day</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {r.reservations.map((b) => (
                  <li key={b.id} className="rounded bg-red-50 px-3 py-2 text-red-800">
                    {timeFmt(b.startTime)} to {timeFmt(b.endTime)} · {b.user.name}
                    {b.purpose ? ` · ${b.purpose}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}