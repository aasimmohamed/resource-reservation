import ResourceForm from "../ResourceForm";
import { createResource } from "../actions";

export default function NewResourcePage() {
  return (
    <main className="mx-auto max-w-xl p-5 sm:p-8">
      <h1 className="mb-6 text-2xl font-bold">Add resource</h1>
      <ResourceForm action={createResource} submitLabel="Create resource" />
    </main>
  );
}