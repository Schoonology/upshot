var sh = require('shelljs')
  , config = require('../lib/config')

function clean(argv, options, loader) {
  if (!config.init) {
    return
  }

  config.clean()
  sh.rm('-rf', config.root)
}

module.exports = clean
