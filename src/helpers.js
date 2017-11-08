import { isNaN } from 'lodash'

export const injectTaskTickerToken = (name, id) => {
  const match = name.match(/^#(\S+)\s*(\S.*)$/)

  if (match) {
    return `#${id} ${match[2]}`
  }
  return `#${id} ${name}`
}

export const scanTickerTokens = str => {
  // TODO github special namings for pull requests which intercepts with our tokens. This is a hack we should find a better way
  if (str.startsWith('Merge pull request')) {
    return []
  }

  const match = str.match(/#\d+/gi) || []
  return match.map(x => parseInt(x.slice(1), 10)).filter(num => !isNaN(num))
}

export const hasProjectToken = str => {
  const match = str.match(/^#P/)
  return !!match
}
