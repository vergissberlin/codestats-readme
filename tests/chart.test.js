import { describe, it, expect } from 'vitest';
import { renderBarChart } from '../src/lib/chart.js';

describe('renderBarChart', () => {
  it('renders one line per entry with key, bar and value', () => {
    const chart = renderBarChart({ js: 100, ts: 50 }, { bar: '#', width: 10 });
    const lines = chart.split('\n').filter((line) => line.trim());

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/js.*#.*100/);
    expect(lines[1]).toMatch(/ts.*#.*50/);
  });

  it('right-aligns keys to the width of the longest key', () => {
    const chart = renderBarChart({ a: 10, longestkey: 10 }, { bar: '#', width: 10 });
    const lines = chart.split('\n').filter((line) => line.trim());

    // 'a' should be left-padded to the same column width as 'longestkey',
    // plus the constant 2-space indent used for every row
    expect(lines[0]).toMatch(/^ {11}a \|/);
    expect(lines[1]).toMatch(/^ {2}longestkey \|/);
  });

  it('scales bar length relative to the largest value', () => {
    const chart = renderBarChart({ full: 100, half: 50, zero: 0 }, { bar: '#', width: 20 });
    const lines = chart.split('\n').filter((line) => line.trim());

    const barLength = (line) => (line.match(/\|(\s*[#]*\s*)\|/)?.[1].match(/#/g) ?? []).length;

    expect(barLength(lines[0])).toBe(20); // full: 100/100 * 20
    expect(barLength(lines[1])).toBe(10); // half: 50/100 * 20
    expect(barLength(lines[2])).toBe(0); // zero: 0/100 * 20
  });

  it('returns an empty string for empty data', () => {
    expect(renderBarChart({}, { bar: '#', width: 20 })).toBe('');
  });

  it('falls back to the configured width when every value is zero', () => {
    // Mirrors the vendored library's original `maxVal || width` behaviour.
    expect(() => renderBarChart({ a: 0, b: 0 }, { bar: '#', width: 20 })).not.toThrow();
  });
});
