import { AsyncLocalStorage } from 'node:async_hooks';
import type { UsageStats } from '#/server/utils/UsageStats';

export type StepMetadata = {
  usage?: UsageStats;
} & Record<string, unknown>;

interface StepContext {
  metadata: StepMetadata;
  stepId: number;
}

export const stepContext = new AsyncLocalStorage<StepContext>();

export function hasStepContext(): boolean {
  return !!stepContext.getStore();
}

export function getStepContext(): StepContext | undefined {
  return stepContext.getStore();
}

export function requireStepContext(): StepContext {
  const context = getStepContext();
  if (!context) {
    throw new Error('No step context available. This function must be called within a step.');
  }
  return context;
}

export function getStepMetadata() {
  return requireStepContext().metadata;
}

export function setStepMetadata(updates: Record<string, unknown>): void {
  const context = requireStepContext();
  Object.assign(context.metadata as object, updates);
}
