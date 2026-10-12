import { prisma } from "@/lib/prisma";
import ReservationForm from "../ReservationForm";

export const dynamic = "force-dynamic";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ resourceId?: string }>;
}) {
  const { resourceId } = await searchParams;

  const [resources, users] = await Promise.all([
    prisma.resource.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-xl p-5 sm:p-8">
      <h1 className="mb-6 text-2xl font-bold">Book a resource</h1>
      <ReservationForm
        resources={resources}
        users={users}
        defaultResourceId={resourceId}
      />
    </main>
  );
}