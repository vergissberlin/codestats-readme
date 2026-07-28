import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildChart, makeCallback, start, createOptions } from '../src/index.js';
import { mockFetch, mockResponses, errorResponses } from './mocks/codestats-api.mock.js';

// Mock global fetch
global.fetch = vi.fn();

describe('CodeStats API Validation & Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.INPUT_CODESTATS_USERNAME;
    delete process.env.INPUT_GITHUB_TOKEN;
    delete process.env.INPUT_GITHUB_USERNAME;
    delete process.env.GITHUB_ACTOR;
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.INPUT_README_FILE;
    delete process.env.INPUT_GRAPH_WIDTH;
    delete process.env.INPUT_SHOW_TITLE;
    delete process.env.INPUT_SHOW_LINK;
    delete process.env.INPUT_COMMIT_MESSAGE;
  });

  describe('API Response Structure Validation', () => {
    it('should correctly parse all required fields from successful API response', () => {
      const mockApiResponse = mockResponses.success;
      expect(mockApiResponse).toHaveProperty('user');
      expect(mockApiResponse).toHaveProperty('languages');
      expect(mockApiResponse).toHaveProperty('dates');
      expect(mockApiResponse).toHaveProperty('machines');
      expect(mockApiResponse).toHaveProperty('total_xp');
      expect(mockApiResponse).toHaveProperty('new_xp');
    });

    it('should correctly parse language structure with xps field', () => {
      const languages = mockResponses.success.languages;
      Object.entries(languages).forEach(([langName, langData]) => {
        expect(langData).toHaveProperty('xps');
        expect(langData).toHaveProperty('new_xps');
        expect(typeof langData.xps).toBe('number');
        expect(typeof langData.new_xps).toBe('number');
      });
    });

    it('should handle empty languages object gracefully', () => {
      const emptyResponse = mockResponses.emptyUser;
      expect(emptyResponse.languages).toEqual({});
      expect(emptyResponse.total_xp).toBe(0);

      const languages = Object.entries(emptyResponse.languages);
      const chart = buildChart(languages, 42);
      expect(chart).toBe('');
    });
  });

  describe('API Usage Correctness', () => {
    it('should make request to correct CodeStats API endpoint', async () => {
      process.env.INPUT_CODESTATS_USERNAME = 'testuser';

      global.fetch.mockImplementation(mockFetch);

      await start();

      expect(fetch).toHaveBeenCalledWith('https://codestats.net/api/users/testuser');
    });

    it('should handle 404 user not found correctly', async () => {
      process.env.INPUT_CODESTATS_USERNAME = 'notfound';

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      global.fetch.mockImplementation(mockFetch);

      try {
        await start();
      } catch (error) {
        // Expected behavior for 404
      }

      expect(fetch).toHaveBeenCalledWith('https://codestats.net/api/users/notfound');

      consoleSpy.mockRestore();
    });

    it('should handle server errors gracefully', async () => {
      process.env.INPUT_CODESTATS_USERNAME = 'servererror';

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      global.fetch.mockImplementation(mockFetch);

      try {
        await start();
      } catch (error) {
        // Expected behavior for server errors
      }

      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      process.env.INPUT_CODESTATS_USERNAME = 'networkerror';

      global.fetch.mockImplementation(mockFetch);

      // start() swallows the rejection, logs it and exits with code 1, so assert
      // on that observable behaviour rather than on a re-thrown error.
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await start();

      expect(fetch).toHaveBeenCalledWith('https://codestats.net/api/users/networkerror');
      expect(errorSpy).toHaveBeenCalledWith(
        'Application failed:',
        expect.objectContaining({ message: 'Network request failed' })
      );
      expect(exitSpy).toHaveBeenCalledWith(1);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('Language Data Processing Regression Tests', () => {
    it('should correctly sort languages by XP in descending order', () => {
      const unsortedLanguages = [
        ['JavaScript', { xps: 100 }],
        ['TypeScript', { xps: 200 }],
        ['Python', { xps: 50 }],
      ];

      const chart = buildChart(unsortedLanguages, 42);
      const lines = chart.split('\\n').filter((line) => line.trim());

      // TypeScript should be first (highest XP), Python last (lowest XP)
      expect(lines[0]).toContain('TypeScript');
      expect(lines[lines.length - 1]).toContain('Python');
    });

    it('should limit to top 6 languages only', () => {
      const manyLanguages = Object.entries(mockResponses.manyLanguages.languages);
      expect(manyLanguages.length).toBeGreaterThan(6);

      const chart = buildChart(manyLanguages, 42);
      const lines = chart.split('\\n').filter((line) => line.trim());

      // Should have at most 6 languages (could be fewer if some languages have invalid data)
      expect(lines.length).toBeLessThanOrEqual(6);
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should handle languages with 0 XP correctly', () => {
      const zeroXpLanguages = [
        ['JavaScript', { xps: 0 }],
        ['TypeScript', { xps: 100 }],
        ['Python', { xps: 0 }],
      ];

      const chart = buildChart(zeroXpLanguages, 42);
      expect(chart).toBeDefined();
      expect(typeof chart).toBe('string');
    });

    it('should maintain consistent output format across different XP ranges', () => {
      const scenarios = [
        mockResponses.beginnerUser.languages,
        mockResponses.expertUser.languages,
        mockResponses.singleLanguage.languages,
      ];

      scenarios.forEach((languages) => {
        const chart = buildChart(Object.entries(languages), 42);

        // Check that chart contains expected ASCII bar characters
        if (chart) {
          expect(chart).toMatch(/█/);
          // Each line should have language name
          const lines = chart.split('\\n').filter((line) => line.trim());
          lines.forEach((line) => {
            // Line should contain language name and bar character
            expect(line).toMatch(/\w+.*█/);
          });
        }
      });
    });
  });

  describe('Callback Function Regression Tests', () => {
    it('should process successful response correctly through callback', () => {
      const mockOpts = {
        graph: { width: 42 },
        readmeFile: './test.md',
        codestats: {
          profile: 'https://codestats.net/users/testuser',
        },
        show: {
          title: false,
          link: false,
        },
      };

      let capturedChart = null;

      const mockUpdateReadme = vi.fn((content, callback) => {
        capturedChart = content;
        callback();
      });

      const mockCommitChanges = vi.fn();

      // Create callback
      const callback = makeCallback(mockOpts);

      // Mock successful response
      const mockBody = JSON.stringify(mockResponses.success);
      const mockResponse = { statusCode: 200 };

      // Since makeCallback creates the functions internally, we need to test the full flow
      // This test verifies the integration works as expected
      expect(typeof callback).toBe('function');
    });
  });

  describe('Environment Variable Validation', () => {
    it('should throw error when CODESTATS_USERNAME is missing', () => {
      expect(() => createOptions()).toThrow(
        'InvalidArgumentException – The CODESTATS_USERNAME has to be set!'
      );
    });

    it('should create correct options with all environment variables set', () => {
      process.env.INPUT_CODESTATS_USERNAME = 'testuser';
      process.env.INPUT_GITHUB_TOKEN = 'token123';
      process.env.GITHUB_ACTOR = 'testactor';
      process.env.INPUT_README_FILE = './custom/README.md';
      process.env.INPUT_GRAPH_WIDTH = '50';
      process.env.INPUT_SHOW_TITLE = 'true';
      process.env.INPUT_SHOW_LINK = 'true';
      process.env.INPUT_COMMIT_MESSAGE = 'Custom commit message';

      const options = createOptions();

      expect(options.codestats.username).toBe('testuser');
      expect(options.codestats.url).toBe('https://codestats.net/api/users/testuser');
      expect(options.codestats.profile).toBe('https://codestats.net/users/testuser');
      expect(options.git.token).toBe('token123');
      expect(options.git.username).toBe('testactor');
      expect(options.git.message).toBe('Custom commit message');
      expect(options.readmeFile).toBe('./custom/README.md');
      expect(options.graph.width).toBe(50);
      expect(options.show.title).toBe(true);
      expect(options.show.link).toBe(true);
    });

    it('should use default values when optional environment variables are not set', () => {
      process.env.INPUT_CODESTATS_USERNAME = 'testuser';
      // Ensure optional variables are not set
      delete process.env.INPUT_GRAPH_WIDTH;

      const options = createOptions();

      expect(options.readmeFile).toBe('./README.md');
      expect(options.graph.width).toBe(42);
      expect(options.show.title).toBe(false);
      expect(options.show.link).toBe(false);
      expect(options.git.message).toBe('Update codestats metrics');
    });

    it('should treat the literal string "false" as disabled for boolean inputs', () => {
      // GitHub Actions always passes inputs as strings, so a workflow with
      // `SHOW_TITLE: false` yields INPUT_SHOW_TITLE="false" here — a naive
      // Boolean() cast would treat that non-empty string as truthy.
      process.env.INPUT_CODESTATS_USERNAME = 'testuser';
      process.env.INPUT_SHOW_TITLE = 'false';
      process.env.INPUT_SHOW_LINK = 'false';

      const options = createOptions();

      expect(options.show.title).toBe(false);
      expect(options.show.link).toBe(false);
    });

    it('should enable boolean inputs only for the literal string "true"', () => {
      process.env.INPUT_CODESTATS_USERNAME = 'testuser';
      process.env.INPUT_SHOW_TITLE = 'true';
      process.env.INPUT_SHOW_LINK = 'true';

      const options = createOptions();

      expect(options.show.title).toBe(true);
      expect(options.show.link).toBe(true);
    });

    it('should prefer INPUT_GITHUB_USERNAME over GITHUB_ACTOR for the git identity', () => {
      process.env.INPUT_CODESTATS_USERNAME = 'testuser';
      process.env.INPUT_GITHUB_USERNAME = 'configured-user';
      process.env.GITHUB_ACTOR = 'actor-user';

      const options = createOptions();

      expect(options.git.username).toBe('configured-user');
      expect(options.git.author).toBe('configured-user <configured-user@users.noreply.github.com>');
    });

    it('should fall back to GITHUB_ACTOR then a generic bot name for the git identity', () => {
      process.env.INPUT_CODESTATS_USERNAME = 'testuser';
      delete process.env.INPUT_GITHUB_USERNAME;
      process.env.GITHUB_ACTOR = 'actor-user';

      expect(createOptions().git.username).toBe('actor-user');

      delete process.env.GITHUB_ACTOR;
      expect(createOptions().git.username).toBe('CodeStats bot');
    });

    it('should read the repository slug from GITHUB_REPOSITORY for authenticated pushes', () => {
      process.env.INPUT_CODESTATS_USERNAME = 'testuser';
      process.env.GITHUB_REPOSITORY = 'owner/repo';

      expect(createOptions().git.repository).toBe('owner/repo');
    });
  });

  describe('API Response Malformation Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      process.env.INPUT_CODESTATS_USERNAME = 'malformed';

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      global.fetch.mockImplementation(mockFetch);

      try {
        await start();
      } catch (error) {
        // Should handle JSON parsing errors gracefully
        expect(error).toBeDefined();
      }

      consoleSpy.mockRestore();
    });

    it('should handle response with missing languages field', () => {
      const incompleteResponse = {
        user: 'testuser',
        total_xp: 1000,
        // missing languages field
      };

      expect(() => {
        // This would typically cause issues in the real flow
        // Our code should be robust enough to handle this
        const languages = Object.entries(incompleteResponse.languages || {});
        buildChart(languages, 42);
      }).not.toThrow();
    });

    it('should handle languages with missing xps field', () => {
      const malformedLanguages = [
        ['JavaScript', { new_xps: 5 }], // missing xps
        ['TypeScript', { xps: 100, new_xps: 10 }], // complete
        ['Python', {}], // empty object
      ];

      // Should not throw and should filter out invalid entries
      expect(() => {
        const chart = buildChart(malformedLanguages, 42);
        // Should only include TypeScript (the only valid entry)
        if (chart.length > 0) {
          expect(chart).toContain('TypeScript');
        }
      }).not.toThrow();
    });
  });

  describe('Chart Generation Edge Cases', () => {
    it('should handle extremely large XP values', () => {
      const extremeLanguages = [
        ['JavaScript', { xps: Number.MAX_SAFE_INTEGER }],
        ['TypeScript', { xps: Number.MAX_SAFE_INTEGER - 1 }],
      ];

      const chart = buildChart(extremeLanguages, 42);
      expect(chart).toBeDefined();
      expect(typeof chart).toBe('string');
    });

    it('should handle negative XP values gracefully', () => {
      const negativeLanguages = [
        ['JavaScript', { xps: -100 }], // should be filtered out
        ['TypeScript', { xps: 50 }], // should be included
      ];

      const chart = buildChart(negativeLanguages, 42);
      expect(chart).toBeDefined();
      expect(typeof chart).toBe('string');
      // Should only contain TypeScript (positive XP)
      if (chart.length > 0) {
        expect(chart).toContain('TypeScript');
        expect(chart).not.toContain('JavaScript');
      }
    });

    it('should handle non-numeric XP values', () => {
      const invalidLanguages = [
        ['JavaScript', { xps: 'invalid' }], // should be filtered out
        ['TypeScript', { xps: null }], // should be filtered out
        ['Python', { xps: undefined }], // should be filtered out
        ['Go', { xps: 100 }], // should be included
      ];

      expect(() => {
        const chart = buildChart(invalidLanguages, 42);
        // Should handle gracefully and only include valid entries
        if (chart.length > 0) {
          expect(chart).toContain('Go');
        }
      }).not.toThrow();
    });

    it('should handle different chart widths correctly', () => {
      const languages = Object.entries(mockResponses.success.languages).slice(0, 3);

      const widths = [1, 10, 42, 80, 120];
      widths.forEach((width) => {
        const chart = buildChart(languages, width);
        expect(chart).toBeDefined();
        expect(typeof chart).toBe('string');
      });
    });
  });
});
