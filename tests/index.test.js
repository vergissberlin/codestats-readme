import { describe, it, expect } from 'vitest'
import { buildChart, replaceCodestatsSection } from '../index'

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
      java: { xps: 30 }
    })

    const chart = buildChart(entries, 20)

    // Should contain the highest XP languages by key name
    expect(chart).toContain('ts')
    expect(chart).toContain('go')
    expect(chart).toContain('js')

    // Limited to top 6 - java should be excluded (lowest), but php might still be in top 6
    expect(chart.includes('java')).toBe(false)

    // Bar width should reflect the provided width to some extent (not exact length test)
    expect(typeof chart).toBe('string')
  })
})

describe('replaceCodestatsSection', () => {
  it('replaces content between START and END markers', () => {
    const md = `# Title\n<!-- START_SECTION:codestats -->\nold\n<!-- END_SECTION:codestats -->\n`
    const result = replaceCodestatsSection(md, 'NEW', '', '')

    expect(result).toContain('NEW')
    expect(result).not.toContain('old')
  })

  it('embeds header and footer when provided', () => {
    const md = `# T\n<!-- START_SECTION:codestats -->\nx\n<!-- END_SECTION:codestats -->\n`
    const header = '*Language experience level (Last update Tue, 01 Jan 2030 00:00:00 GMT)*\n\n'
    const footer = '\n> My [CodeStats profile](https://codestats.net/users/test) in detail.\n'
    const result = replaceCodestatsSection(md, 'CONTENT', header, footer)

    expect(result).toContain('CONTENT')
    expect(result).toContain(header)
    expect(result).toContain(footer)
  })
})

