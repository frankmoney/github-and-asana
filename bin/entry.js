const [mode = process.env.MODE || 'githook'] = process.argv.slice(2)

if (mode === 'githook') {
  console.log('Starting GitHub integration')
  require('./githook')
} else if (mode === 'asana') {
  console.log('Starting Asana integration')
  require('./asana')
}
