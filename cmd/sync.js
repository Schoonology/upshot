var fs = require('fs')
  , sh = require('shelljs')
  , common = require('../lib/common')
  , config = require('../lib/config')

function sync(argv, options, loader) {
  if (!config.init) {
    return loader.run(['init'])
  }

  return common.git(['pull', 'upshot', 'master'])
    .then(function () {
      return common.git(['add', '.'])
    })
    .then(function () {
      return common.git(['commit', '--allow-empty-message', '-m', '""'])
    })
    .then(function () {
      return common.git(['push', 'upshot', 'master'])
    })
}

module.exports = sync
