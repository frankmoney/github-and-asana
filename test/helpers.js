import { expect } from 'chai'
import { replaceOrSetId } from '../src/helpers'

describe('helpers', () => {
  it('should format numberless name', () => {
    const name = 'Chris Nolan'
    const newName = replaceOrSetId(name, 123)
    const expected = '[123] Chris Nolan'

    expect(newName).to.be.eq(expected)
  })
  it('should format name with number', () => {
    const name = '[1345135] Chris Nolan'
    const newName = replaceOrSetId(name, 123)
    const expected = '[123] Chris Nolan'

    expect(newName).to.be.eq(expected)
  })
  it('should format name with bad number', () => {
    const name = '[134fsdf5135] Chris Nolan'
    const newName = replaceOrSetId(name, 123)
    const expected = '[123] Chris Nolan'

    expect(newName).to.be.eq(expected)
  })
  it('should format empty name', () => {
    const name = ''
    const newName = replaceOrSetId(name, 123)
    const expected = '[123] '

    expect(newName).to.be.eq(expected)
  })
})
