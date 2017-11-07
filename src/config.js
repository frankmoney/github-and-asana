import assert from 'assert'
import props from 'deep-property'

function checkConfig(conf) {
  function required(...names) {
    names.forEach(name => {
      assert(props.has(conf, name), `Missing configuration option \`${name}\``)
    })
  }

  function optional(name, defaultValue) {
    if (!props.has(conf, name)) {
      props.set(conf, name, defaultValue)
    }
  }

  required(
    'asana.accessToken',
    'asana.workspaceId',
    'postgres.host',
    'postgres.database',
    'postgres.user',
    'postgres.password',
    'github.username',
    'github.password'
  )

  optional('postgres.port', 5432)
  optional('port', 3000)
  optional('host', '0.0.0.0')

  return conf
}

export default checkConfig({
  port: process.env.PORT, // optional
  host: process.env.HOST, // optional
  asana: {
    accessToken: process.env.ASANA_ACCESS_TOKEN,
    workspaceId: process.env.ASANA_WORKSPACE,
    ignoredTags: ['design'],
  },
  postgres: {
    host: process.env.PGHOST,
    port: process.env.PGPORT, // optional
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  },
  github: {
    username: process.env.GITHUB_USER,
    password: process.env.GITHUB_PASSWORD,
  },
})
