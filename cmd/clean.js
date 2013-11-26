var fs = require('fs')
  , sh = require('shelljs')
  , config = require('../lib/config')

function clean(argv, options, loader) {
  if (!fs.existsSync(config.CONFIG_PATH)) {
    return console.log('Upshot files have already been removed.')
  }

  config.clean()
  sh.rm('-rf', config.root)
  console.log('Upshot files removed.')
}

module.exports = clean
