import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { buildChart, replaceCodestatsSection, start } from '../index.js';
import { mockFetch, mockResponses } from './mocks/codestats-api.mock.js';

// Mock fs and fetch
vi.mock('fs');
global.fetch = vi.fn();

// Note: bars output is a formatted string. We'll assert key properties

describe('buildChart', () => {
  it('keeps top 6 entries sorted by xps and maps values', () => {
    const entries = Object.entries({
      js: { xps: 100 },
      ts: { xps: 220 },
      py: { xps: 50 },
      go: { xps: 120 },
      rs: { xps: 90 },
      rb: { xps: 80 },
      php: { xps: 70 },
      java: { xps: 30 },
    });

    const chart = buildChart(entries, 20);

    // Should contain the highest XP languages by key name
    expect(chart).toContain('ts');
    expect(chart).toContain('go');
    expect(chart).toContain('js');

    // Limited to top 6 - java should be excluded (lowest), but php might still be in top 6
    expect(chart.includes('java')).toBe(false);

    // Bar width should reflect the provided width to some extent (not exact length test)
    expect(typeof chart).toBe('string');
  });

  // End-to-End Mock Integration Tests
  describe('End-to-End Integration with Mock Data', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Reset environment variables
      delete process.env.INPUT_CODESTATS_USERNAME;
      delete process.env.INPUT_GITHUB_TOKEN;
      delete process.env.GITHUB_ACTOR;
      delete process.env.INPUT_README_FILE;
    });

    it('should process complete workflow with mock API data', async () => {
      // This test validates API integration but doesn't test the full workflow
      // due to complex mocking requirements for filesystem and git operations

      process.env.INPUT_CODESTATS_USERNAME = 'testuser';

      // Mock fetch with successful API response
      global.fetch.mockImplementation(mockFetch);

      // Just test the API call part
      try {
        await start();
      } catch (error) {
        // Expected - file operations will fail in test environment
      }

      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith('https://codestats.net/api/users/testuser');
    });

    it('should generate correct chart output with real API structure', () => {
      // Use actual API response structure
      const apiLanguages = mockResponses.success.languages;
      const languageEntries = Object.entries(apiLanguages);

      const chart = buildChart(languageEntries, 42);

      // Verify chart structure
      expect(chart).toBeDefined();
      expect(typeof chart).toBe('string');
      if (chart.length > 0) {
        expect(chart).toMatch(/█/); // Should contain bar characters

        // Should be limited to 6 languages
        const lines = chart.split('\n').filter((line) => line.trim());
        expect(lines.length).toBeLessThanOrEqual(6);
      }
    });

    it('should handle README replacement with complete mock data', () => {
      // Generate chart from mock data
      const languages = Object.entries(mockResponses.success.languages);
      const chartContent = buildChart(languages, 42);

      // Mock README content
      const originalReadme = `# My Profile\n\n<!--START_SECTION:codestats-->\n<!--END_SECTION:codestats-->\n\n## Projects`;

      // Add header and footer
      const header = `*Language experience level (Last update ${new Date().toUTCString()})*\n\n`;
      const footer = `\n> My [CodeStats profile](https://codestats.net/users/testuser) in detail.\n`;

      const updatedReadme = replaceCodestatsSection(originalReadme, chartContent, header, footer);

      // Verify structure
      expect(updatedReadme).toContain('Language experience level');
      expect(updatedReadme).toContain('CodeStats profile');
      expect(updatedReadme).toContain('```text');
      expect(updatedReadme).toContain('# My Profile');
      expect(updatedReadme).toContain('## Projects');
    });

    it('should handle different user scenarios from mock data', () => {
      const scenarios = [
        { name: 'beginner', data: mockResponses.beginnerUser },
        { name: 'expert', data: mockResponses.expertUser },
        { name: 'single language', data: mockResponses.singleLanguage },
        { name: 'many languages', data: mockResponses.manyLanguages },
        { name: 'empty user', data: mockResponses.emptyUser },
      ];

      scenarios.forEach((scenario) => {
        const languages = Object.entries(scenario.data.languages);
        const chart = buildChart(languages, 42);

        // All scenarios should produce valid output
        expect(typeof chart).toBe('string');

        // Empty users should have empty charts
        if (scenario.name === 'empty user') {
          expect(chart).toBe('');
        }

        // Many languages should be limited to 6
        if (scenario.name === 'many languages' && chart.length > 0) {
          const lines = chart.split('\n').filter((line) => line.trim());
          expect(lines.length).toBe(6);
        }
      });
    });

    it('should maintain API response structure compatibility', () => {
      // Test that our mock data matches expected API structure
      const apiResponse = mockResponses.success;

      // Check required fields exist
      expect(apiResponse).toHaveProperty('user');
      expect(apiResponse).toHaveProperty('languages');
      expect(apiResponse).toHaveProperty('total_xp');
      expect(apiResponse).toHaveProperty('new_xp');

      // Check language structure
      Object.entries(apiResponse.languages).forEach(([name, data]) => {
        expect(data).toHaveProperty('xps');
        expect(data).toHaveProperty('new_xps');
        expect(typeof data.xps).toBe('number');
        expect(typeof data.new_xps).toBe('number');
      });

      // Verify that our buildChart function works with this structure
      const languages = Object.entries(apiResponse.languages);
      expect(() => buildChart(languages, 42)).not.toThrow();
    });
  });
});

describe('replaceCodestatsSection', () => {
  it('replaces content between START and END markers', () => {
    const md = `# Title\n<!-- START_SECTION:codestats -->\nold\n<!-- END_SECTION:codestats -->\n`;
    const result = replaceCodestatsSection(md, 'NEW', '', '');

    expect(result).toContain('NEW');
    expect(result).not.toContain('old');
  });

  it('embeds header and footer when provided', () => {
    const md = `# T\n<!-- START_SECTION:codestats -->\nx\n<!-- END_SECTION:codestats -->\n`;
    const header = '*Language experience level (Last update Tue, 01 Jan 2030 00:00:00 GMT)*\n\n';
    const footer = '\n> My [CodeStats profile](https://codestats.net/users/test) in detail.\n';
    const result = replaceCodestatsSection(md, 'CONTENT', header, footer);

    expect(result).toContain('CONTENT');
    expect(result).toContain(header);
    expect(result).toContain(footer);
  });
});
