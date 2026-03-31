import * as cheerio from 'cheerio';
import { createError } from '#/server/utils/createError';

export async function scrapeAndCleanContent(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Failed to fetch URL: ${response.statusText}`,
    });
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove();

  let content = '';
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.recipe',
    '.entry-content',
    '.post-content',
    '.content',
  ];

  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length && element.html()?.trim()) {
      content = element.html()?.trim() ?? '';
      break;
    }
  }

  if (!content) {
    content = $('body').html()?.trim() ?? '';
  }

  const cleanedContent = content
    .replace(/<h[1-6][^>]*>/gi, '\n### ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleanedContent;
}
