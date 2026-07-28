import type { BarsOptions } from '../types/index.js';

/**
 * ASCII bar chart renderer.
 *
 * Vendored port of the `key | bar | value` histogram algorithm from
 * jstrace/bars (MIT, https://github.com/jstrace/bars) instead of depending on
 * it directly: that package was never published to npm (installed straight
 * from a GitHub tarball), which is a supply-chain and reliability risk —
 * network policies that don't allow arbitrary codeload.github.com fetches
 * (e.g. this project's own CI sandbox) cannot install it at all.
 */
export function renderBarChart(data: Record<string, number>, opts: BarsOptions): string {
  const barChar = opts.bar || '#';
  const width = opts.width || 60;

  const entries = Object.entries(data);
  const maxKeyLength = max(entries.map(([key]) => key.length)) ?? 0;
  const maxValue = max(entries.map(([, value]) => value)) || width;

  let output = '';
  for (const [key, value] of entries) {
    const shown = Math.round(width * (value / maxValue));
    const bar = barChar.repeat(shown) + ' '.repeat(width - shown);
    output += `  ${key.padStart(maxKeyLength)} | ${bar} | ${value}\n`;
  }

  return output;
}

function max(values: number[]): number | undefined {
  return values.length === 0 ? undefined : values.reduce((a, b) => (b > a ? b : a));
}
