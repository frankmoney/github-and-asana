import GitHubApi from 'github'
import B from 'bluebird'
import config from './config'

const { github: githubConfig } = config

const github = new GitHubApi({
  // required
  version: '3.0.0',
  // optional
  debug: false,
  protocol: 'https',
  host: 'api.github.com',
  timeout: 5000,
  Promise: B,
})

github.authenticate({
  type: 'basic',
  ...githubConfig,
})

export default github
