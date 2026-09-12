"use client";

import { useMemo, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, Textarea } from "@/components/ui/textarea";
import { TEMPLATE_VARIABLES, renderTemplate } from "@/lib/message-template";

interface TemplateItem {
  id: string;
  name: string;
  body: string;
}

const SAMPLE_LEAD = {
  name: "Bluebonnet BBQ",
  category: "Restaurant",
  address: "612 E 6th St, Austin, TX",
  phone: "+1 512 555 0134",
  website: "https://bluebonnetbbq.example.com",
  email: "hello@bluebonnetbbq.example.com",
};

function TemplatePreview({ body }: { body: string }) {
  const rendered = useMemo(
    () => renderTemplate(body, SAMPLE_LEAD, "You", "Your Company"),
    [body]
  );
  if (!body.trim()) return null;
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-3">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Preview
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{rendered}</p>
    </div>
  );
}

export function TemplatesManager({
  initialTemplates,
}: {
  initialTemplates: TemplateItem[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBody, setEditBody] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, body }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not create template");
        return;
      }
      setTemplates((prev) => [...prev, payload.template]);
      setName("");
      setBody("");
    } finally {
      setCreating(false);
    }
  }

  function beginEdit(template: TemplateItem) {
    setEditingId(template.id);
    setEditName(template.name);
    setEditBody(template.body);
  }

  async function saveEdit() {
    if (!editingId) return;
    const res = await fetch(`/api/templates/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, body: editBody }),
    });
    if (res.ok) {
      const { template } = await res.json();
      setTemplates((prev) => prev.map((t) => (t.id === template.id ? template : t)));
      setEditingId(null);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function duplicate(template: TemplateItem) {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${template.name} (copy)`, body: template.body }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not duplicate template");
        return;
      }
      setTemplates((prev) => [...prev, payload.template]);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        {templates.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No templates yet. Create your first outreach message on the right.
          </p>
        )}
        {templates.map((template) =>
          editingId === template.id ? (
            <Card key={template.id}>
              <CardContent className="flex flex-col gap-3 pt-5">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                <Textarea
                  rows={5}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                />
                <TemplatePreview body={editBody} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveEdit}>
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card key={template.id}>
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <CardTitle className="min-w-0 truncate text-base">{template.name}</CardTitle>
                <span className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicate(template)}
                    title="Duplicate"
                    disabled={creating}
                  >
                    <Copy />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => beginEdit(template)} title="Edit">
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(template.id)} title="Delete">
                    <Trash2 className="text-destructive" />
                  </Button>
                </span>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {template.body}
                </p>
                <TemplatePreview body={template.body} />
              </CardContent>
            </Card>
          )
        )}
      </div>

      <Card className="h-fit lg:sticky lg:top-8">
        <CardHeader>
          <CardTitle>New template</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-name">Name</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Friendly intro"
                required
                maxLength={100}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-body">Message</Label>
              <Textarea
                id="tpl-body"
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Hi {{business_name}}! …"
                required
                maxLength={2000}
              />
            </div>
            <TemplatePreview body={body} />
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <span>Click to insert:</span>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    title={v.description}
                    onClick={() => setBody((b) => b + v.key)}
                    className="rounded bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {v.key}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" pending={creating} className="w-fit">
              <Plus />
              Add template
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
