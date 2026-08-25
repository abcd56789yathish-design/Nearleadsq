import { db } from "@/lib/db";
import { findEmailOnSite } from "@/lib/email-finder";

const CONCURRENCY = 4;
const PROGRESS_UPDATE_EVERY = 3;

/**
 * Fire-and-forget background worker for an enrichment job.
 * Processes leads with a small concurrency pool and updates
 * progress counters in the DB so the UI can poll them.
 */
export function startEnrichmentJob(jobId: string) {
  void processJob(jobId).catch(async (error) => {
    await db.enrichmentJob
      .update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
          finishedAt: new Date(),
        },
      })
      .catch(() => undefined);
  });
}

async function processJob(jobId: string) {
  // Claim the job exactly once.
  const claimed = await db.enrichmentJob.updateMany({
    where: { id: jobId, status: "PENDING" },
    data: { status: "RUNNING" },
  });
  if (claimed.count === 0) return;

  const job = await db.enrichmentJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  const userId = job.userId;

  const leadIds: string[] = JSON.parse(job.leadIds);
  const leads = await db.lead.findMany({
    where: {
      id: { in: leadIds },
      userId: job.userId,
      email: null,
      website: { not: null },
    },
    select: { id: true, website: true },
  });

  if (!leads.length) {
    await finishJob(jobId, 0);
    return;
  }

  let processed = 0;
  let found = 0;
  let sinceUpdate = 0;

  async function worker(queue: typeof leads) {
    while (queue.length) {
      const lead = queue.shift();
      if (!lead) return;

      try {
        const result = await findEmailOnSite(lead.website as string);
        if (result.email) {
          found += 1;
          await db.lead.update({
            where: { id: lead.id },
            data: {
              email: result.email,
              emailSource: result.sourceUrl,
              updatedAt: new Date(),
            },
          });
          await db.leadActivity.create({
            data: {
              userId,
              leadId: lead.id,
              type: "EMAIL_FOUND",
              detail: `Found ${result.email}`,
            },
          });
        }
      } catch {
        // Single-site failures shouldn't kill the job.
      }

      processed += 1;
      sinceUpdate += 1;
      if (sinceUpdate >= PROGRESS_UPDATE_EVERY || queue.length === 0) {
        sinceUpdate = 0;
        await db.enrichmentJob.update({
          where: { id: jobId },
          data: { processed, found },
        });
      }
    }
  }

  const queue = [...leads];
  const workers = Array.from(
    { length: Math.min(CONCURRENCY, queue.length) },
    () => worker(queue)
  );
  await Promise.all(workers);

  await finishJob(jobId, found);
}

async function finishJob(jobId: string, found: number) {
  await db.enrichmentJob
    .update({
      where: { id: jobId },
      data: {
        status: "DONE",
        found,
        finishedAt: new Date(),
      },
    })
    .catch(() => undefined);
}
