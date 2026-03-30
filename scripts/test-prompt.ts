#!/usr/bin/env tsx

/**
 * CLI tool for testing AI prompts in isolation
 * Usage: pnpm test-prompt <type> <input>
 *
 * Examples:
 *   pnpm test-prompt ingredient "2 cups green bell peppers, diced"
 *   pnpm test-prompt ingredient "1/2 tsp salt"
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import type { UsageStats } from '#server/utils/UsageStats.js';
import { parseIngredient } from '#server/services/prompts/parseIngredient.js';

function printUsage() {
  console.log(`
${chalk.bold('Usage:')}
  pnpm test-prompt <type> <input>

${chalk.bold('Available prompt types:')}
  ${chalk.cyan(
    'ingredient'
  )}  - Parse ingredient text into structured components

${chalk.bold('Examples:')}
  pnpm test-prompt ingredient "2 cups green bell peppers, diced"
  pnpm test-prompt ingredient "1/2 tsp salt"
  pnpm test-prompt ingredient "3 garlic cloves, minced"
`);
}

async function testIngredientPrompt(input: string) {
  console.log(`\n${chalk.bold.cyan('Testing Ingredient Parser')}`);
  console.log(`${chalk.yellow('Input:')} "${input}"\n`);

  try {
    const startTime = Date.now();
    const result = await parseIngredient(input);
    const duration = Date.now() - startTime;

    console.log(
      `${chalk.bold.green('✓ Parsed successfully')} (${duration}ms)\n`
    );

    // Display parsed result in a clean table
    const resultTable = new Table({
      chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
      colWidths: [12, 40],
      style: { 'padding-left': 2, 'padding-right': 0 },
    });

    resultTable.push(
      [chalk.blue('quantity'), result.parsed.quantity ?? chalk.dim('null')],
      [chalk.blue('unit'), result.parsed.unit ?? chalk.dim('null')],
      [chalk.blue('name'), result.parsed.name],
      [chalk.blue('note'), result.parsed.note ?? chalk.dim('null')]
    );

    console.log(chalk.bold('Result:'));
    console.log(resultTable.toString());

    logUsage(result.usage);
    console.log();
  } catch (error) {
    console.error(`\n${chalk.bold.yellow('✗ Error:')}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

const logUsage = (usage: UsageStats) => {
  // Display usage statistics in a clean table
  const usageTable = new Table({
    chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
    colWidths: [20, 20],
    style: { 'padding-left': 2, 'padding-right': 0 },
  });

  usageTable.push(
    [chalk.magenta('Input tokens'), usage.inputTokens.toLocaleString()],
    [chalk.magenta('Output tokens'), usage.outputTokens.toLocaleString()],
    [
      chalk.magenta('Cache creation'),
      usage.cacheCreationInputTokens?.toLocaleString() ?? '0',
    ],
    [
      chalk.magenta('Cache read'),
      usage.cacheReadInputTokens?.toLocaleString() ?? '0',
    ]
  );

  console.log(`\n${chalk.bold('Usage Statistics:')}`);
  console.log(usageTable.toString());
};

// Main execution
async function main() {
  const [promptType, ...inputArgs] = process.argv.slice(2);
  const input = inputArgs.join(' ');

  if (!promptType || !input) {
    printUsage();
    process.exit(1);
  }

  switch (promptType.toLowerCase()) {
    case 'ingredient':
      await testIngredientPrompt(input);
      break;

    // Future prompt types can be added here:
    // case 'recipe':
    //   await testRecipePrompt(input);
    //   break;

    default:
      console.error(`${chalk.yellow('Unknown prompt type:')} ${promptType}\n`);
      printUsage();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
