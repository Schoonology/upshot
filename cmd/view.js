var opener = require('opener')
  , config = require('../lib/config')

function view(argv, options, loader) {
  if (!config.init) {
    console.error('Upshot not initialized. Please run `upshot init` first.')
    return
  }

  opener(config.viewUrl)
}

module.exports = view
