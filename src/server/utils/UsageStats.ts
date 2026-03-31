import type { GenerateObjectResult } from 'ai';

interface UsageStatsData {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export class UsageStats implements UsageStatsData {
  inputTokens = 0;
  outputTokens = 0;
  totalTokens = 0;
  cacheCreationInputTokens = 0;
  cacheReadInputTokens = 0;
  inputCost = 0;
  outputCost = 0;
  totalCost = 0;

  constructor(stats?: UsageStatsData) {
    if (stats) {
      this.inputTokens = stats.inputTokens;
      this.outputTokens = stats.outputTokens;
      this.totalTokens = stats.totalTokens;
      this.cacheCreationInputTokens = stats.cacheCreationInputTokens;
      this.cacheReadInputTokens = stats.cacheReadInputTokens;
      this.inputCost = stats.inputCost;
      this.outputCost = stats.outputCost;
      this.totalCost = stats.totalCost;
    }
  }

  addFromLlm(result: GenerateObjectResult<unknown>) {
    const stats = this.calculateUsage(result);
    this.addFromUsageStats(stats);
    return this;
  }

  static FromLlm(result: GenerateObjectResult<unknown>) {
    return new UsageStats().addFromLlm(result);
  }

  addFromUsageStats(stats: UsageStatsData) {
    this.inputTokens += stats.inputTokens;
    this.outputTokens += stats.outputTokens;
    this.totalTokens += stats.totalTokens;
    this.cacheCreationInputTokens += stats.cacheCreationInputTokens;
    this.cacheReadInputTokens += stats.cacheReadInputTokens;
    this.inputCost += stats.inputCost;
    this.outputCost += stats.outputCost;
    this.totalCost += stats.totalCost;
    return this;
  }

  private calculateUsage(result: GenerateObjectResult<unknown>): UsageStatsData {
    const inputTokens = result.usage.inputTokens ?? 0;
    const outputTokens = result.usage.outputTokens ?? 0;
    const totalTokens = result.usage.totalTokens ?? 0;
    const cacheReadInputTokens = result.usage.cachedInputTokens ?? 0;

    const anthropicMetadata = result.providerMetadata?.anthropic as
      | { cacheCreationInputTokens?: number }
      | undefined;
    const cacheCreationInputTokens =
      typeof anthropicMetadata?.cacheCreationInputTokens === 'number'
        ? anthropicMetadata.cacheCreationInputTokens
        : 0;

    // Claude Sonnet 4 pricing: $3/M input, $15/M output, $3.75/M cache write, $0.30/M cache read
    const inputCost = (inputTokens / 1_000_000) * 3;
    const cacheWriteCost = (cacheCreationInputTokens / 1_000_000) * 3.75;
    const cacheReadCost = (cacheReadInputTokens / 1_000_000) * 0.3;
    const outputCost = (outputTokens / 1_000_000) * 15;
    const totalCost = inputCost + cacheWriteCost + cacheReadCost + outputCost;

    const decimalPrecision = 4;

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      cacheCreationInputTokens,
      cacheReadInputTokens,
      inputCost: Number(inputCost.toFixed(decimalPrecision)),
      outputCost: Number(outputCost.toFixed(decimalPrecision)),
      totalCost: Number(totalCost.toFixed(decimalPrecision)),
    };
  }
}
