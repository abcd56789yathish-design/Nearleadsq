"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { mapHeaders, parseCsv, type LeadCsvField } from "@/lib/csv";

interface ImportResult {
  imported: number;
  duplicates: number;
  invalid: number;
  limitReached?: boolean;
  skippedByLimit?: number;
}

interface Preview {
  nameOk: boolean;
  totalRows: number;
  rows: Record<LeadCsvField, string>[];
}

const PREVIEW_FIELDS: LeadCsvField[] = ["name", "phone", "email", "website", "category"];

const COUNTRIES: [string, string][] = [
  ["", "Phone country: auto"],
  ["US", "United States +1"],
  ["CA", "Canada +1"],
  ["GB", "United Kingdom +44"],
  ["IE", "Ireland +353"],
  ["AU", "Australia +61"],
  ["NZ", "New Zealand +64"],
  ["IN", "India +91"],
  ["PK", "Pakistan +92"],
  ["PH", "Philippines +63"],
  ["AE", "UAE +971"],
  ["ZA", "South Africa +27"],
  ["NG", "Nigeria +234"],
  ["KE", "Kenya +254"],
  ["DE", "Germany +49"],
  ["FR", "France +33"],
  ["ES", "Spain +34"],
  ["IT", "Italy +39"],
  ["NL", "Netherlands +31"],
  ["BR", "Brazil +55"],
  ["MX", "Mexico +52"],
];

export function CsvImportModal({
  hasSearchFilter,
  onClose,
  onImported,
}: {
  hasSearchFilter: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [country, setCountry] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const router = useRouter();

  async function handleFile(next: File | null) {
    setError(null);
    setResult(null);
    if (!next) {
      setFile(null);
      setPreview(null);
      return;
    }
    const rows = parseCsv(await next.text());
    if (rows.length === 0) {
      setError("Could not read this file as CSV.");
      return;
    }
    const mapping = mapHeaders(rows[0]);
    const fieldIndex = (field: LeadCsvField) => mapping.indexOf(field);
    setFile(next);
    setPreview({
      nameOk: fieldIndex("name") !== -1,
      totalRows: Math.max(0, rows.length - 1),
      rows: rows.slice(1, 6).map((row) =>
        Object.fromEntries(
          PREVIEW_FIELDS.map((field) => {
            const idx = fieldIndex(field);
            return [field, idx === -1 ? "" : (row[idx] ?? "").trim()];
          })
        ) as Record<LeadCsvField, string>
      ),
    });
  }

  async function submit() {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (country) form.append("country", country);
      const res = await fetch("/api/leads/import", { method: "POST", body: form });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Import failed — please try again.");
        return;
      }
      setResult(payload as ImportResult);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function finish() {
    if (result && result.imported > 0) {
      // Imported leads don't belong to a search, so a filtered view can't show them.
      if (hasSearchFilter) {
        router.push("/leads");
        return;
      }
      onImported();
    }
    onClose();
  }

  function downloadTemplate() {
    const csv =
      "Name,Phone,Email,Website,Address,City,Category,Notes\n" +
      'Acme Cafe,+15551234567,hello@acmecafe.com,www.acmecafe.com,12 Main St,Springfield,Restaurant,"Met at trade show"\n' +
      "Bright Smile Dental,+447700900123,info@brightsmile.co.uk,brightsmile.co.uk,5 High St,London,Dentist,\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "nearleadsq-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
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
        <h2 className="text-base font-semibold">Import leads from CSV</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Bring leads you already have into your pipeline. Duplicates are skipped.
        </p>

        {result ? (
          <>
            <div className="mt-4 flex items-start gap-3 rounded-md bg-success/10 px-3 py-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <div className="text-sm">
                <p className="font-medium">Imported {result.imported} lead{result.imported === 1 ? "" : "s"}</p>
                {(result.duplicates > 0 || result.invalid > 0) && (
                  <p className="mt-0.5 text-muted-foreground">
                    {result.duplicates > 0 &&
                      `${result.duplicates} duplicate${result.duplicates === 1 ? "" : "s"} skipped`}
                    {result.duplicates > 0 && result.invalid > 0 && " · "}
                    {result.invalid > 0 &&
                      `${result.invalid} row${result.invalid === 1 ? "" : "s"} missing a name`}
                  </p>
                )}
                {result.limitReached && (
                  <p className="mt-1 text-warning">
                    {result.skippedByLimit} row{result.skippedByLimit === 1 ? "" : "s"} skipped —
                    plan limit reached.{" "}
                    <a href="/billing" className="underline">
                      Upgrade your plan
                    </a>
                  </p>
                )}
                {hasSearchFilter && result.imported > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Imported leads aren&apos;t part of this search — you&apos;ll find them under All
                    leads.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={finish}>Done</Button>
            </div>
          </>
        ) : (
          <>
            <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border px-4 py-8 text-center transition-colors hover:bg-secondary/40">
              <FileUp className="size-6 text-muted-foreground" />
              <span className="text-sm font-medium">
                {file ? file.name : "Click to choose a .csv file"}
              </span>
              <span className="text-xs text-muted-foreground">
                Columns: Name (required), Phone, Email, Website, Address, City, Category, Notes
              </span>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <div className="mt-3">
              <Select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                aria-label="Default phone country"
              >
                {COUNTRIES.map(([code, label]) => (
                  <option key={code || "auto"} value={code}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            {preview && !preview.nameOk && (
              <p className="mt-3 flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                No &quot;Name&quot; column found — rename one column to &quot;Name&quot; or
                &quot;Business&quot;.
              </p>
            )}

            {preview && preview.nameOk && preview.rows.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[420px] text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50 text-left uppercase tracking-wide text-muted-foreground">
                      {PREVIEW_FIELDS.map((field) => (
                        <th key={field} className="px-2.5 py-1.5 font-medium capitalize">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/60 last:border-0">
                        {PREVIEW_FIELDS.map((field) => (
                          <td key={field} className="max-w-36 truncate px-2.5 py-1.5">
                            {row[field] || <span className="text-muted-foreground/50">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="bg-secondary/30 px-2.5 py-1.5 text-xs text-muted-foreground">
                  First {preview.rows.length} of {preview.totalRows.toLocaleString()} row{preview.totalRows === 1 ? "" : "s"}
                </p>
              </div>
            )}

            {preview && preview.nameOk && preview.rows.length === 0 && (
              <p className="mt-3 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
                This file has a header but no lead rows.
              </p>
            )}

            {error && (
              <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={downloadTemplate}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Download template
              </button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  pending={submitting}
                  disabled={!file || !preview?.nameOk || preview.rows.length === 0}
                  onClick={submit}
                >
                  <FileUp />
                  Import
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
