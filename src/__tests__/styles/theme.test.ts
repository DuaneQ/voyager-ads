import { describe, it, expect } from 'vitest'
import theme from '../../styles/theme'

describe('theme design tokens', () => {
  it('exports a theme object', () => {
    expect(theme).toBeTruthy()
  })

  it('has the correct primary colour', () => {
    expect(theme.palette.primary.main).toBe('#1a73e8')
    expect(theme.palette.primary.dark).toBe('#1558b0')
  })

  it('has the correct text colours', () => {
    expect(theme.palette.text.primary).toBe('#213547')
  })

  it('has white backgrounds', () => {
    expect(theme.palette.background.default).toBe('#ffffff')
    expect(theme.palette.background.paper).toBe('#ffffff')
  })

  it('uses 8px spacing unit', () => {
    // theme.spacing(1) returns '8px' in MUI
    expect(theme.spacing(1)).toBe('8px')
    expect(theme.spacing(2)).toBe('16px')
  })

  it('uses borderRadius 8', () => {
    expect(theme.shape.borderRadius).toBe(8)
  })

  it('sets font family', () => {
    expect(theme.typography.fontFamily).toContain('system-ui')
  })
})
