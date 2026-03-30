#!/usr/bin/env tsx

/**
 * CLI tool for batch processing ingredients from CSV
 * Usage: pnpm batch-parse <input.csv> <output.csv> [--delay <ms>]
 *
 * Examples:
 *   pnpm batch-parse ingredients.csv results.csv
 *   pnpm batch-parse ingredients.csv results.csv --delay 100
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parseIngredient } from '#server/services/prompts/parseIngredient.js';

interface BatchResult {
  original: string;
  quantity: string;
  unit: string;
  name: string;
  note: string;
  cost: string;
  status: 'success' | 'error';
  error: string;
}

interface AggregateStats {
  totalRows: number;
  successCount: number;
  errorCount: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
}

function printUsage() {
  console.log(`
${chalk.bold('Usage:')}
  pnpm batch-parse <input.csv> <output.csv> [--delay <ms>]

${chalk.bold('Arguments:')}
  ${chalk.cyan('input.csv')}   - Input CSV file (no header, one ingredient per line)
  ${chalk.cyan('output.csv')}  - Output CSV file path

${chalk.bold('Options:')}
  ${chalk.cyan('--delay <ms>')} - Optional delay between API calls (default: 0)

${chalk.bold('Examples:')}
  pnpm batch-parse ingredients.csv results.csv
  pnpm batch-parse ingredients.csv results.csv --delay 100

${chalk.bold('Input CSV Format:')}
  No header row, one ingredient per line:
    2 cups green bell peppers, diced
    1/2 tsp salt
    3 garlic cloves, minced

${chalk.bold('Output CSV Format:')}
  Columns: original, quantity, unit, name, note, cost, status, error
`);
}

async function processBatch(
  inputPath: string,
  outputPath: string,
  delay: number = 0
): Promise<void> {
  // Validate input file exists
  if (!existsSync(inputPath)) {
    console.error(chalk.red(`Error: Input file not found: ${inputPath}`));
    process.exit(1);
  }

  // Read input CSV
  const fileContent = readFileSync(inputPath, 'utf-8');
  const records = parse(fileContent, {
    skip_empty_lines: true,
    relax_column_count: true,
  });

  // Extract ingredients (single column, no header)
  const ingredients: string[] = records.map((record: string[]) =>
    record[0]?.trim()
  );

  if (ingredients.length === 0) {
    console.error(chalk.red('Error: No ingredients found in input file'));
    process.exit(1);
  }

  console.log(
    `\n${chalk.bold.cyan('Batch Processing Ingredients')}`
  );
  console.log(`${chalk.yellow('Input:')} ${inputPath}`);
  console.log(`${chalk.yellow('Output:')} ${outputPath}`);
  console.log(`${chalk.yellow('Total ingredients:')} ${ingredients.length}\n`);

  const results: BatchResult[] = [];
  const stats: AggregateStats = {
    totalRows: ingredients.length,
    successCount: 0,
    errorCount: 0,
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCacheCreationTokens: 0,
    totalCacheReadTokens: 0,
  };

  const startTime = Date.now();

  // Process each ingredient
  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    console.log(
      `${chalk.dim('Processing')} ${i + 1}/${ingredients.length}... ${chalk.dim(ingredient.slice(0, 50))}${ingredient.length > 50 ? chalk.dim('...') : ''}`
    );

    try {
      const result = await parseIngredient(ingredient);

      results.push({
        original: ingredient,
        quantity: result.parsed.quantity ?? '',
        unit: result.parsed.unit ?? '',
        name: result.parsed.name,
        note: result.parsed.note ?? '',
        cost: result.usage.estimatedCost?.toFixed(6) ?? '0',
        status: 'success',
        error: '',
      });

      stats.successCount++;
      stats.totalCost += result.usage.estimatedCost ?? 0;
      stats.totalInputTokens += result.usage.inputTokens;
      stats.totalOutputTokens += result.usage.outputTokens;
      stats.totalCacheCreationTokens +=
        result.usage.cacheCreationInputTokens ?? 0;
      stats.totalCacheReadTokens += result.usage.cacheReadInputTokens ?? 0;
    } catch (error) {
      results.push({
        original: ingredient,
        quantity: '',
        unit: '',
        name: '',
        note: '',
        cost: '0',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });

      stats.errorCount++;
    }

    // Optional delay between calls
    if (delay > 0 && i < ingredients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Write output CSV
  const csvOutput = stringify(results, {
    header: true,
    columns: ['original', 'quantity', 'unit', 'name', 'note', 'cost', 'status', 'error'],
  });

  writeFileSync(outputPath, csvOutput, 'utf-8');

  // Display summary
  console.log(`\n${chalk.bold.green('✓ Batch Processing Complete')}\n`);

  const summaryTable = new Table({
    chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
    colWidths: [25, 25],
    style: { 'padding-left': 2, 'padding-right': 0 },
  });

  const successRate = ((stats.successCount / stats.totalRows) * 100).toFixed(1);
  const avgCost = stats.totalCost / stats.totalRows;
  const totalCacheTokens =
    stats.totalCacheCreationTokens + stats.totalCacheReadTokens;
  const cacheHitRate =
    totalCacheTokens > 0
      ? ((stats.totalCacheReadTokens / totalCacheTokens) * 100).toFixed(1)
      : '0.0';

  summaryTable.push(
    [chalk.cyan('Output file'), outputPath],
    ['', ''],
    [chalk.cyan('Total rows'), stats.totalRows.toLocaleString()],
    [
      chalk.cyan('Successful'),
      `${stats.successCount.toLocaleString()} (${successRate}%)`,
    ],
    [
      chalk.cyan('Failed'),
      `${stats.errorCount.toLocaleString()} (${(100 - Number(successRate)).toFixed(1)}%)`,
    ],
    ['', ''],
    [chalk.cyan('Total cost'), `$${stats.totalCost.toFixed(6)}`],
    [chalk.cyan('Average cost/row'), `$${avgCost.toFixed(6)}`],
    ['', ''],
    [chalk.cyan('Input tokens'), stats.totalInputTokens.toLocaleString()],
    [chalk.cyan('Output tokens'), stats.totalOutputTokens.toLocaleString()],
    [
      chalk.cyan('Cache creation'),
      stats.totalCacheCreationTokens.toLocaleString(),
    ],
    [chalk.cyan('Cache reads'), stats.totalCacheReadTokens.toLocaleString()],
    [chalk.cyan('Cache hit rate'), `${cacheHitRate}%`],
    ['', ''],
    [chalk.cyan('Duration'), `${duration}s`]
  );

  console.log(chalk.bold('Summary:'));
  console.log(summaryTable.toString());
  console.log();
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  if (
    args.length < 2 ||
    args.includes('--help') ||
    args.includes('-h')
  ) {
    printUsage();
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  // Parse optional delay flag
  let delay = 0;
  const delayIndex = args.indexOf('--delay');
  if (delayIndex !== -1 && args[delayIndex + 1]) {
    delay = parseInt(args[delayIndex + 1], 10);
    if (isNaN(delay) || delay < 0) {
      console.error(chalk.red('Error: --delay must be a non-negative number'));
      process.exit(1);
    }
  }

  await processBatch(inputPath, outputPath, delay);
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
