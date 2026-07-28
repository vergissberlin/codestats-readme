import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/chart.js', () => ({
  renderBarChart: vi.fn(() => {
    throw new Error('rendering exploded');
  }),
}));

describe('buildChart error handling', () => {
  it('returns an empty string and logs when the chart renderer throws', async () => {
    const { buildChart } = await import('../src/index.js');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = buildChart([['JavaScript', { xps: 100 }]], 42);

    expect(result).toBe('');
    expect(errorSpy).toHaveBeenCalledWith('Chart generation failed:', expect.any(Error));

    errorSpy.mockRestore();
  });
});
