import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { TemplatesManager } from "@/components/templates-manager";

export default async function TemplatesPage() {
  const ctx = await requireWorkspace();
  if (!ctx) redirect("/login");
  const templates = await db.template.findMany({
    where: { userId: ctx.userId, workspaceId: ctx.workspace.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Message Templates</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Reusable WhatsApp messages. Use variables like{" "}
        <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">
          {"{{business_name}}"}
        </code>{" "}
        to personalize each message.
      </p>
      <TemplatesManager
        initialTemplates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          body: t.body,
        }))}
      />
    </div>
  );
}
