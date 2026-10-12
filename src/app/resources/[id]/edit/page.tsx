import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ResourceForm from "../../ResourceForm";
import { updateResource } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resourceId = Number(id);
  if (!Number.isInteger(resourceId)) notFound();

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) notFound();

  return (
    <main className="mx-auto max-w-xl p-5 sm:p-8">
      <h1 className="mb-6 text-2xl font-bold">Edit {resource.name}</h1>
      <ResourceForm
        action={updateResource.bind(null, resource.id)}
        defaults={resource}
        submitLabel="Save changes"
      />
    </main>
  );
}