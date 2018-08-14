# GitHub/Asana integration
This is an ad hoc built Asana/GitHub integration which keeps tickets in sync with relevant pull request statuses. 

Thank you for your interest in this! 
Currently the integration is not in any way a product, just our internal tool which we felt might be used by someone else. Please feel free to deploy it and tinker with it! 

Unfortunately we don't have any spare time at the moment even to document the tool properly; we can commit to answering specific questions, but not much besides that, sorry! 

# Install packages
```
yarn install
```

# Setup Environment
See process.env.***** below
```js
{
  port: process.env.PORT, // optional
  host: process.env.HOST, // optional
  asana: {
    accessToken: process.env.ASANA_ACCESS_TOKEN,
    projectId: process.env.ASANA_PROJECT,
    workspaceId: process.env.ASANA_WORKSPACE,
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
}
```

# Start program
Program could be started in two modes - `asana` and `githook`. First numerate Asana tasks, second listens pull requests and merges
```
  npm start [asana|githook]
```

# Tests
```
  npm test
```

## Webhook types
 - Handle `pull_request` event with all actions.

## Notifications
- receive pull request

