import { isNaN } from 'lodash'

export const replaceOrSetId = (name, id) => {
  const match = name.match(/^\[(\S+)\]\s*(\S.*)$/)

  if (match) {
    return `[${id}] ${match[2]}`
  }
  return `[${id}] ${name}`
}

export const scanIdTokens = str => {
  const match = str.match(/#\d+/gi) || []
  return match.map(x => parseInt(x.slice(1), 10)).filter(num => !isNaN(num))
}
