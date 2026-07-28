import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { makeUpdateReadme, makeCommitChanges } from '../src/index.js';

vi.mock('fs');

const { mockGit } = vi.hoisted(() => ({
  mockGit: {
    status: vi.fn(),
    remote: vi.fn(),
    commit: vi.fn(),
    push: vi.fn(),
  },
}));

vi.mock('simple-git', () => ({
  default: vi.fn(() => mockGit),
}));

describe('makeUpdateReadme', () => {
  const baseOpts = {
    readmeFile: './README.md',
    codestats: { profile: 'https://codestats.net/users/test' },
    show: { title: false, link: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the readme, replaces the section, and writes the result', () => {
    const original =
      '# Title\n<!-- START_SECTION:codestats -->\nold\n<!-- END_SECTION:codestats -->\n';
    fs.readFile.mockImplementation((_path, _enc, cb) => cb(null, original));
    fs.writeFile.mockImplementation((_path, _data, _enc, cb) => cb(null));

    const callback = vi.fn();
    makeUpdateReadme(baseOpts)('NEW CONTENT', callback);

    expect(fs.readFile).toHaveBeenCalledWith('./README.md', 'utf8', expect.any(Function));
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('NEW CONTENT');
    expect(writtenContent).not.toContain('old');
    expect(callback).toHaveBeenCalled();
  });

  it('includes the title header and profile link footer when enabled', () => {
    const original = '<!-- START_SECTION:codestats -->\nold\n<!-- END_SECTION:codestats -->';
    fs.readFile.mockImplementation((_path, _enc, cb) => cb(null, original));
    fs.writeFile.mockImplementation((_path, _data, _enc, cb) => cb(null));

    const opts = { ...baseOpts, show: { title: true, link: true } };
    makeUpdateReadme(opts)('CONTENT', vi.fn());

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Language experience level');
    expect(writtenContent).toContain('https://codestats.net/users/test');
  });

  it('omits header and footer when disabled', () => {
    const original = '<!-- START_SECTION:codestats -->\nold\n<!-- END_SECTION:codestats -->';
    fs.readFile.mockImplementation((_path, _enc, cb) => cb(null, original));
    fs.writeFile.mockImplementation((_path, _data, _enc, cb) => cb(null));

    makeUpdateReadme(baseOpts)('CONTENT', vi.fn());

    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).not.toContain('Language experience level');
    expect(writtenContent).not.toContain('CodeStats profile');
  });

  it('logs and still invokes the callback when the file cannot be read', () => {
    fs.readFile.mockImplementation((_path, _enc, cb) => cb(new Error('ENOENT')));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const callback = vi.fn();
    makeUpdateReadme(baseOpts)('CONTENT', callback);

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Error reading README file:', expect.any(Error));

    errorSpy.mockRestore();
  });

  it('logs but still invokes the callback when the file cannot be written', () => {
    fs.readFile.mockImplementation((_path, _enc, cb) =>
      cb(null, '<!-- START_SECTION:codestats -->x<!-- END_SECTION:codestats -->')
    );
    fs.writeFile.mockImplementation((_path, _data, _enc, cb) => cb(new Error('EACCES')));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const callback = vi.fn();
    makeUpdateReadme(baseOpts)('CONTENT', callback);

    expect(callback).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Error writing README file:', expect.any(Error));

    errorSpy.mockRestore();
  });
});

describe('makeCommitChanges', () => {
  const baseOpts = {
    readmeFile: './README.md',
    git: {
      username: 'bot',
      author: 'bot <bot@users.noreply.github.com>',
      message: 'Update stats',
      token: '',
      repository: '',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGit.commit.mockResolvedValue(undefined);
    mockGit.push.mockResolvedValue(undefined);
    mockGit.remote.mockResolvedValue(undefined);
    mockGit.status.mockResolvedValue(undefined);
  });

  it('commits with the formatted author and pushes', async () => {
    makeCommitChanges(baseOpts)();
    await vi.waitFor(() => expect(mockGit.push).toHaveBeenCalled());

    expect(mockGit.commit).toHaveBeenCalledWith('Update stats', './README.md', {
      '--author': 'bot <bot@users.noreply.github.com>',
    });
    expect(mockGit.remote).not.toHaveBeenCalled();
  });

  it('authenticates the remote first when a token and repository are configured', async () => {
    const opts = {
      ...baseOpts,
      git: { ...baseOpts.git, token: 'secret-token', repository: 'owner/repo' },
    };

    makeCommitChanges(opts)();
    await vi.waitFor(() => expect(mockGit.push).toHaveBeenCalled());

    expect(mockGit.remote).toHaveBeenCalledWith([
      'set-url',
      'origin',
      'https://x-access-token:secret-token@github.com/owner/repo.git',
    ]);
  });

  it('does not attempt to authenticate the remote when the token is missing', async () => {
    const opts = { ...baseOpts, git: { ...baseOpts.git, repository: 'owner/repo' } };

    makeCommitChanges(opts)();
    await vi.waitFor(() => expect(mockGit.push).toHaveBeenCalled());

    expect(mockGit.remote).not.toHaveBeenCalled();
  });

  it('logs an error if the git operations fail', async () => {
    mockGit.commit.mockRejectedValue(new Error('nothing to commit'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    makeCommitChanges(baseOpts)();
    await vi.waitFor(() => expect(errorSpy).toHaveBeenCalled());

    expect(errorSpy).toHaveBeenCalledWith('Git operations failed:', expect.any(Error));
    expect(mockGit.push).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
