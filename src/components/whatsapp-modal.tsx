"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { buildWhatsAppUrl, renderTemplate } from "@/lib/message-template";
import type { TemplateLead } from "@/lib/message-template";

export interface LeadMessageTarget extends TemplateLead {
  id: string;
  phoneE164: string;
}

interface Props {
  lead: LeadMessageTarget;
  templates: { id: string; name: string; body: string }[];
  senderName?: string | null;
  onClose: () => void;
  onContacted: (leadId: string) => void;
}

export function WhatsAppModal({ lead, templates, senderName, onClose, onContacted }: Props) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [sending, setSending] = useState(false);

  const initialBody = templates[0]?.body ?? "";
  const [message, setMessage] = useState(() =>
    renderTemplate(initialBody, lead, senderName)
  );

  function applyTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    setMessage(renderTemplate(template?.body ?? "", lead, senderName));
  }

  const waUrl = useMemo(
    () => buildWhatsAppUrl(lead.phoneE164, message),
    [lead.phoneE164, message]
  );

  async function openAndMark() {
    setSending(true);
    window.open(waUrl, "_blank", "noopener");
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONTACTED" }),
      });
      onContacted(lead.id);
    } finally {
      setSending(false);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">
          Message {lead.name}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{lead.phoneE164}</p>

        {templates.length === 0 ? (
          <>
            <p className="mt-4 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
              You have no templates yet.
            </p>
            <div className="mt-4 flex flex-col gap-1.5">
              <Label htmlFor="wa-msg">Message</Label>
              <Textarea
                id="wa-msg"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi ${lead.name}! 👋 …`}
              />
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 flex flex-col gap-1.5">
              <Label htmlFor="tpl-select">Template</Label>
              <Select
                id="tpl-select"
                value={templateId}
                onChange={(e) => applyTemplate(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              <Label htmlFor="wa-preview">Preview (editable)</Label>
              <Textarea
                id="wa-preview"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#25D366] text-white hover:bg-[#1fb857]"
            pending={sending}
            disabled={!message.trim()}
            onClick={openAndMark}
          >
            <ExternalLink />
            Open chat & mark contacted
          </Button>
        </div>
      </div>
    </div>
  );
}
