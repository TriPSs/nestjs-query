import { afterEach, describe, expect, it, vi } from 'vitest'

import { GitHubReleases } from '../snippets/github-releases.jsx'

// Exercise the snippet's hooks without installing React into the docs runtime.
// Mintlify injects these globals when it renders the component.
const renderReleases = () => {
  const state: unknown[] = []
  let cursor = 0
  let dependencies: unknown[] | undefined
  let pendingEffect: (() => () => void) | undefined
  let cleanup: (() => void) | undefined
  let tree
  const setState = vi.fn((index: number, value) => {
    state[index] = typeof value === 'function' ? value(state[index]) : value
  })
  vi.stubGlobal('useState', (initial) => {
    const index = cursor++
    if (!(index in state)) state[index] = initial
    return [state[index], (value) => setState(index, value)]
  })
  vi.stubGlobal('useEffect', (effect, next: unknown[]) => {
    if (!dependencies || next.some((value, index) => !Object.is(value, dependencies?.[index]))) {
      dependencies = next
      pendingEffect = effect
    }
  })
  const Update = vi.fn()
  vi.stubGlobal('Update', Update)
  vi.stubGlobal('React', {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } })
  })
  const render = () => {
    cursor = 0
    tree = GitHubReleases()
    if (pendingEffect) {
      cleanup?.()
      cleanup = pendingEffect()
      pendingEffect = undefined
    }
  }
  const findAll = (type, node = tree): (typeof tree)[] => {
    if (!node || typeof node !== 'object') return []
    if (Array.isArray(node)) return node.flatMap((child) => findAll(type, child))
    return [...(node.type === type ? [node] : []), ...findAll(type, node.props.children)]
  }
  render()
  return {
    render,
    button: () => findAll('button')[0],
    versions: () => findAll(Update).map((node) => node.props.label),
    busy: () => tree.props['aria-busy'],
    unmount: () => cleanup?.(),
    setState
  }
}

const release = (id: number) => ({ id, tag_name: `v1.0.${id}`, draft: false })
const firstPage = Array.from({ length: 10 }, (_, id) => release(id))
const response = (releases) => ({ ok: true, json: async () => releases })
const deferred = () => {
  let resolve!: (value: unknown) => void
  let reject!: (reason: Error) => void
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('GitHubReleases interactions', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the pagination button in place while loading and when the last page arrives', async () => {
    const nextPage = deferred()
    const fetch = vi.fn().mockResolvedValueOnce(response(firstPage)).mockReturnValueOnce(nextPage.promise)
    vi.stubGlobal('fetch', fetch)
    const view = renderReleases()
    await vi.waitFor(() => {
      view.render()
      expect(view.versions()).toHaveLength(10)
    })
    expect(view.button().props['aria-disabled']).toBe(false)
    const buttonType = view.button().type
    view.button().props.onClick()
    view.render()
    expect(view.busy()).toBe(true)
    expect(view.button().type).toBe(buttonType)
    expect(view.button().props['aria-disabled']).toBe(true)
    expect(view.button().props.children).toEqual(['Loading…'])
    expect(fetch.mock.calls[1][0]).toContain('page=2')
    view.button().props.onClick()
    view.render()
    expect(fetch).toHaveBeenCalledTimes(2)

    nextPage.resolve(response([release(9), release(10)]))
    await vi.waitFor(() => {
      view.render()
      expect(view.busy()).toBe(false)
    })
    expect(view.versions()).toEqual([...firstPage, release(10)].map((item) => item.tag_name))
    expect(view.button().type).toBe(buttonType)
    expect(view.button().props['aria-disabled']).toBe(true)
    expect(view.button().props.children).toEqual(['All releases loaded'])
    view.button().props.onClick()
    view.render()
    expect(fetch).toHaveBeenCalledTimes(2)
    view.unmount()
  })

  it.each([false, true])('retries the failed page without dropping loaded releases (older page: %s)', async (olderPage) => {
    const retry = deferred()
    const fetch = vi.fn()
    if (olderPage) fetch.mockResolvedValueOnce(response(firstPage))
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockReturnValueOnce(retry.promise)
    vi.stubGlobal('fetch', fetch)
    const view = renderReleases()
    if (olderPage) {
      await vi.waitFor(() => {
        view.render()
        expect(view.button()?.props['aria-disabled']).toBe(false)
      })
      view.button().props.onClick()
      view.render()
    }
    await vi.waitFor(() => {
      view.render()
      expect(view.button()?.props.children).toEqual(['Try again'])
    })
    expect(view.versions()).toHaveLength(olderPage ? 10 : 0)
    view.button().props.onClick()
    view.render()
    expect(view.button().props['aria-disabled']).toBe(true)
    // Clearing the previous error in the effect must not unmount the retry button.
    view.render()
    expect(view.button().props.children).toEqual(['Loading…'])
    const calls = fetch.mock.calls
    expect(calls.at(-1)?.[0]).toBe(calls.at(-2)?.[0])

    retry.resolve(response([release(10)]))
    await vi.waitFor(() => {
      view.render()
      expect(view.busy()).toBe(false)
    })
    expect(view.versions()).toEqual([...(olderPage ? firstPage : []), release(10)].map((item) => item.tag_name))
    expect(view.button().props.children).toEqual(['All releases loaded'])
    view.unmount()
  })

  it.each(['resolve', 'reject'])('aborts on unmount and ignores a stale request that later %ss', async (outcome) => {
    const pending = deferred()
    const fetch = vi.fn().mockReturnValue(pending.promise)
    vi.stubGlobal('fetch', fetch)
    const view = renderReleases()
    const signal = fetch.mock.calls[0][1].signal
    expect(signal.aborted).toBe(false)
    view.unmount()
    expect(signal.aborted).toBe(true)
    view.setState.mockClear()

    if (outcome === 'resolve') pending.resolve(response(firstPage))
    else pending.reject(new Error('Request aborted'))
    // Drain the fetch, JSON, catch, and finally callbacks after unmount.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(view.setState).not.toHaveBeenCalled()
  })
})
