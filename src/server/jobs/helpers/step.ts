import { eq } from "drizzle-orm";
import { getDb } from "#/server/db";
import { step as stepTable } from "#/server/db/schema";
import { getJobContext, requireJobContext } from "#/server/jobs/helpers/jobContext";
import type { StepMetadata } from "./stepContext";
import { getStepContext, stepContext } from "./stepContext";

// Overload for single-parameter functions
export async function step<TFn extends (arg: any) => any>(
  name: string,
  fn: TFn,
  arg: Parameters<TFn>[0],
  initialMetadata?: StepMetadata,
): Promise<Awaited<ReturnType<TFn>>>;

// Implementation
export async function step(
  name: string,
  fn: (...args: unknown[]) => unknown,
  propsOrArg: unknown,
  initialMetadata?: StepMetadata,
): Promise<unknown> {
  const { jobId } = requireJobContext();
  const db = await getDb();

  const props: unknown[] = Array.isArray(propsOrArg) ? propsOrArg : [propsOrArg];
  const metadata: Record<string, unknown> = initialMetadata ?? {};
  const parentStepId = getStepContext()?.stepId;

  getJobContext()?.onEvent?.({ type: "step_start", name });

  const [insertedStep] = await db
    .insert(stepTable)
    .values({
      jobId,
      name,
      input: (props.length === 1 ? props[0] : props) as unknown,
      metadata,
      parentStepId,
    })
    .returning();

  if (!insertedStep) throw new Error("Failed to create step");

  const context = { metadata, stepId: insertedStep.id };

  try {
    const result = await stepContext.run(context, async () => {
      return await fn(...props);
    });

    await db
      .update(stepTable)
      .set({ output: result as unknown, metadata, completedAt: new Date() })
      .where(eq(stepTable.id, insertedStep.id));

    getJobContext()?.onEvent?.({ type: "step_complete", name });

    return result;
  } catch (error) {
    await db
      .update(stepTable)
      .set({
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        metadata,
        completedAt: new Date(),
      })
      .where(eq(stepTable.id, insertedStep.id));

    getJobContext()?.onEvent?.({
      type: "step_error",
      name,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
