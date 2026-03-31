import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject, type GenerateObjectResult } from 'ai';
import type { z } from 'zod';
import { env } from '#/server/env';
import { hasJobContext, updateJobUsage } from '#/server/jobs/helpers/jobContext';
import { hasStepContext, setStepMetadata } from '#/server/jobs/helpers/stepContext';
import { UsageStats } from '#/server/utils/UsageStats';

export class LLMService {
  anthropic: ReturnType<typeof createAnthropic>;

  constructor() {
    this.anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async generateObject<SCHEMA extends z.ZodType>(
    props: Omit<Parameters<typeof generateObject>[0], 'schema' | 'model'> & {
      schema: SCHEMA;
      model?: Parameters<typeof generateObject>[0]['model'];
    },
  ): Promise<GenerateObjectResult<z.output<SCHEMA>>> {
    const result = await generateObject({
      maxRetries: 3,
      temperature: 0.1,
      model: this.anthropic('claude-sonnet-4-20250514'),
      ...props,
    } as Parameters<typeof generateObject>[0]);

    const usage = UsageStats.FromLlm(result);

    if (hasStepContext()) {
      setStepMetadata({ usage });
    }

    if (hasJobContext()) {
      updateJobUsage(usage);
    }

    return result as GenerateObjectResult<z.output<SCHEMA>>;
  }
}

export const llmService = new LLMService();
