export const formatReleaseNotes = (release) => {
  const html = release.body_html || ''
  const heading = html.match(/^\s*<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>\s*/i)
  if (!heading || !release.tag_name) return html

  // Generated notes repeat the version and date already shown by Update.
  const title = heading[2]
    .replace(/<[^>]*>/g, '')
    .trim()
    .replace(/\s+\(\d{4}-\d{2}-\d{2}\)$/, '')
    .replace(/^v/, '')
  return title === release.tag_name.replace(/^v/, '') ? html.slice(heading[0].length) : html
}

// Mintlify injects React hooks into snippets; they must not be imported from npm.
export const fetchReleases = async (page, signal) => {
  const response = await fetch(`https://api.github.com/repos/TriPSs/nestjs-query/releases?per_page=10&page=${page}`, {
    // GitHub renders and sanitizes the Markdown, preserving links, lists, and code.
    headers: { Accept: 'application/vnd.github.html+json' },
    signal
  })
  if (!response.ok) throw new Error('Unable to load releases')
  const releases = await response.json()
  if (!Array.isArray(releases)) throw new Error('Invalid releases response')
  return { releases: releases.filter((release) => !release.draft), hasMore: releases.length === 10 }
}

export const GitHubReleases = () => {
  const [releases, setReleases] = useState([])
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setError(false)
    fetchReleases(page, controller.signal)
      .then((result) => {
        if (!active) return
        setReleases((previous) => {
          const ids = new Set(previous.map((release) => release.id))
          return [...previous, ...result.releases.filter((release) => !ids.has(release.id))]
        })
        setHasMore(result.hasMore)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [page, attempt])

  return (
    <div className="query-changelog" aria-busy={loading}>
      {releases.map((release) => {
        const notes = formatReleaseNotes(release)
        return (
          <Update
            key={release.id}
            label={release.tag_name}
            description={
              release.published_at
                ? new Date(release.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'UTC'
                  })
                : undefined
            }
            tags={[release.prerelease ? 'Prerelease' : 'Stable']}
          >
            {notes ? (
              <div className="query-changelog-notes" dangerouslySetInnerHTML={{ __html: notes }} />
            ) : (
              <p>No release notes provided.</p>
            )}
            <p>
              <a href={release.html_url}>View release on GitHub →</a>
            </p>
          </Update>
        )
      })}
      <div role="status" aria-live="polite">
        {loading && <p>Loading releases…</p>}
        {!loading && error && (
          <p>Could not load releases. GitHub may be temporarily unavailable or its request limit may have been reached.</p>
        )}
        {!loading && !error && releases.length === 0 && <p>No published releases yet.</p>}
      </div>
      {!loading && (error || hasMore) && (
        <button
          type="button"
          className="query-changelog-button"
          onClick={() => {
            setLoading(true)
            if (error) setAttempt((value) => value + 1)
            else setPage((value) => value + 1)
          }}
        >
          {error ? 'Try again' : 'Load older releases'}
        </button>
      )}
      <p>
        <a href="https://github.com/TriPSs/nestjs-query/releases">Browse all releases on GitHub →</a>
      </p>
    </div>
  )
}
