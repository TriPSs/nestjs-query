import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchReleases, formatReleaseNotes, GitHubReleases } from '../snippets/github-releases.jsx'

describe('formatReleaseNotes', () => {
  const notes =
    '<h3>Features</h3><ul><li><strong>core:</strong> Improved filters <a href="https://github.com">abc123</a></li></ul>'

  it.each([
    '<h2>11.1.0-alpha.3 (2026-11-14)</h2>\n',
    '<h1>v11.1.0-alpha.3</h1>\n',
    '<h2><a href="#version">11.1.0-alpha.3</a></h2>\n'
  ])('removes the redundant release heading: %s', (heading) => {
    expect(formatReleaseNotes({ tag_name: 'v11.1.0-alpha.3', body_html: heading + notes })).toBe(notes)
  })

  it.each([
    notes,
    '<h2>Breaking changes</h2>' + notes,
    '<h2>11.0.0 (2026-11-14)</h2>' + notes,
    '<p>Upgrade instructions</p><h2>11.1.0-alpha.3 (2026-11-14)</h2>' + notes
  ])('preserves substantive headings and other release content', (html) => {
    expect(formatReleaseNotes({ tag_name: 'v11.1.0-alpha.3', body_html: html })).toBe(html)
  })

  it('handles absent notes and missing tags', () => {
    expect(formatReleaseNotes({ tag_name: 'v11.1.0-alpha.3' })).toBe('')
    expect(formatReleaseNotes({ body_html: notes })).toBe(notes)
  })
})

describe('fetchReleases', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('fetches rendered notes for the requested page and forwards cancellation', async () => {
    const releases = [{ id: 1, draft: false, prerelease: true, body_html: '<p>Release notes</p>' }]
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => releases })
    vi.stubGlobal('fetch', fetch)
    const controller = new AbortController()

    await expect(fetchReleases(2, controller.signal)).resolves.toEqual({ releases, hasMore: false })
    expect(fetch).toHaveBeenCalledWith('https://api.github.com/repos/TriPSs/nestjs-query/releases?per_page=10&page=2', {
      headers: { Accept: 'application/vnd.github.html+json' },
      signal: controller.signal
    })
  })

  it('excludes drafts while preserving pagination and prereleases', async () => {
    const releases = Array.from({ length: 10 }, (_, id) => ({ id, draft: id === 0, prerelease: id === 1 }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => releases }))

    await expect(fetchReleases(1)).resolves.toEqual({ releases: releases.slice(1), hasMore: true })
  })

  it('handles an empty release list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))

    await expect(fetchReleases(1)).resolves.toEqual({ releases: [], hasMore: false })
  })

  it.each([403, 429, 500])('rejects HTTP %s so the page can offer a retry', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }))

    await expect(fetchReleases(1)).rejects.toThrow('Unable to load releases')
  })

  it('rejects an unexpected response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'Unexpected response' }) }))

    await expect(fetchReleases(1)).rejects.toThrow('Invalid releases response')
  })

  it('propagates network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(fetchReleases(1)).rejects.toThrow('Failed to fetch')
  })

  it('renders releases with native Update components and unique version labels', () => {
    const releases = [
      {
        id: 1,
        tag_name: 'v11.1.0-alpha.3',
        prerelease: true,
        published_at: '2026-11-14T15:16:53Z',
        body_html: '<h2>11.1.0-alpha.3 (2026-11-14)</h2><h3>Features</h3><p>Improved filters</p>'
      },
      { id: 2, tag_name: 'v11.0.1', prerelease: false, published_at: '2026-11-14T14:00:00Z' }
    ]
    const Update = vi.fn()
    const createElement = vi.fn(() => null)
    // Mintlify supplies hooks and built-in components when rendering the snippet.
    vi.stubGlobal('React', { createElement })
    vi.stubGlobal('Update', Update)
    vi.stubGlobal('useState', (initial) => [Array.isArray(initial) ? releases : initial, vi.fn()])
    vi.stubGlobal('useEffect', vi.fn())

    GitHubReleases()

    const updates = createElement.mock.calls.filter(([type]) => type === Update).map(([, props]) => props)
    expect(updates).toMatchObject([
      { label: 'v11.1.0-alpha.3', description: 'November 14, 2026', tags: ['Prerelease'] },
      { label: 'v11.0.1', description: 'November 14, 2026', tags: ['Stable'] }
    ])
    expect(createElement.mock.calls.some(([type]) => type === 'h2')).toBe(false)
    const notes = createElement.mock.calls.find(([, props]) => props?.className === 'query-changelog-notes')
    expect(notes?.[1].dangerouslySetInnerHTML).toEqual({ __html: '<h3>Features</h3><p>Improved filters</p>' })
  })
})
