import { expect } from 'chai'
import { injectTaskTickerToken, scanTickerTokens } from '../src/helpers'

describe('helpers', () => {
  it('should format numberless name', () => {
    const name = 'Chris Nolan'
    const newName = injectTaskTickerToken(name, 123)
    const expected = '#123 Chris Nolan'

    expect(newName).to.be.eq(expected)
  })
  it('should format name with number', () => {
    const name = '#1345135 Chris Nolan'
    const newName = injectTaskTickerToken(name, 123)
    const expected = '#123 Chris Nolan'

    expect(newName).to.be.eq(expected)
  })
  it('should format name with bad number', () => {
    const name = '#34fsdf5135 Chris Nolan'
    const newName = injectTaskTickerToken(name, 123)
    const expected = '#123 Chris Nolan'

    expect(newName).to.be.eq(expected)
  })
  it('should format empty name', () => {
    const name = ''
    const newName = injectTaskTickerToken(name, 123)
    const expected = '#123 '

    expect(newName).to.be.eq(expected)
  })

  it('should handle many tokens in a single message', () => {
    const commitMessage = 'fix #10 and #30 tasks'
    const tokens = scanTickerTokens(commitMessage)

    expect(tokens).to.have.length(2)
  })
})
