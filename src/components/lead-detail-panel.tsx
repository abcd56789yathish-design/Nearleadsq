"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, MessageCircle, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { WhatsAppModal } from "@/components/whatsapp-modal";

export interface LeadDetailData {
  id: string;
  name: string;
  category: string | null;
  phoneE164: string | null;
  status: string;
  notes: string | null;
  followUpAt: string | null;
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function LeadDetailPanel({
  lead,
  templates,
  senderName,
}: {
  lead: LeadDetailData;
  templates: { id: string; name: string; body: string }[];
  senderName: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [savedNotes, setSavedNotes] = useState(lead.notes ?? "");
  const [followUp, setFollowUp] = useState(toDateInputValue(lead.followUpAt));
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  async function patch(data: Record<string, unknown>) {
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  async function changeStatus(next: string) {
    setStatus(next);
    await patch({ status: next });
  }

  function saveNotes() {
    setSavedNotes(notes);
    void patch({ notes: notes.trim() || null });
  }

  async function saveFollowUp(value: string) {
    setSavingFollowUp(true);
    try {
      await patch({ followUpAt: value || null });
    } finally {
      setSavingFollowUp(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lead-status">Status</Label>
          <Select
            id="lead-status"
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            className="w-44"
          >
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="REPLIED">Replied</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lead-followup">Follow-up</Label>
          <div className="flex items-center gap-2">
            <Input
              id="lead-followup"
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="w-44"
            />
            {followUp !== toDateInputValue(lead.followUpAt) && (
              <>
                <Button
                  size="sm"
                  pending={savingFollowUp}
                  onClick={() => saveFollowUp(followUp)}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFollowUp("");
                    void saveFollowUp("");
                  }}
                >
                  Clear
                </Button>
              </>
            )}
            {followUp === toDateInputValue(lead.followUpAt) && followUp && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" />
                Reminder set
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-notes" className="flex items-center gap-1.5">
          <NotebookPen className="size-3.5" />
          Notes
        </Label>
        <Textarea
          id="lead-notes"
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`Anything worth remembering about ${lead.name}…`}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {notes.trim() === savedNotes.trim()
              ? "All changes saved"
              : "Unsaved changes"}
          </span>
          <Button
            size="sm"
            disabled={notes.trim() === savedNotes.trim()}
            onClick={saveNotes}
          >
            {notes.trim() === savedNotes.trim() ? (
              <>
                <Check />
                Saved
              </>
            ) : (
              "Save notes"
            )}
          </Button>
        </div>
      </div>

      {lead.phoneE164 && (
        <Button
          variant="outline"
          className="border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
          onClick={() => setShowWhatsApp(true)}
        >
          <MessageCircle />
          Reach out on WhatsApp
        </Button>
      )}

      {showWhatsApp && lead.phoneE164 && (
        <WhatsAppModal
          lead={{
            id: lead.id,
            name: lead.name,
            category: lead.category,
            phoneE164: lead.phoneE164,
          }}
          templates={templates}
          senderName={senderName}
          onClose={() => setShowWhatsApp(false)}
          onContacted={() => {
            setStatus("CONTACTED");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
