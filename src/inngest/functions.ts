import { inngest } from "./client";
import { db } from "@/lib/db";
import { processJob } from "@/lib/enrich-worker";

export const enrichRun = inngest.createFunction(
  {
    id: "enrich-run",
    triggers: [{ event: "enrich/run" }],
  },
  async ({ event, step }) => {
    const jobId = event.data.jobId as string;

    return await step.run("run-enrichment", async () => {
      try {
        await processJob(jobId);
      } catch (error) {
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
        throw error;
      }
      return { jobId };
    });
  }
);
