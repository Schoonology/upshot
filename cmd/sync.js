var fs = require('fs')
  , os = require('os')
  , sh = require('shelljs')
  , common = require('../lib/common')
  , config = require('../lib/config')

function sync(argv, options, loader) {
  if (!config.init) {
    return loader.run(['init'])
  }

  return common.git(['fetch', 'upshot'])
    .then(function () {
      return common.git(['commit', '-a', '--allow-empty-message', '-m', 'Sync with "' + os.hostname() + '".'])
    })
    .then(function () {
      return common.git(['rebase', 'upshot/master', '-m', '-s', 'recursive', '-X', 'ours'])
    })
    .then(function () {
      return common.git(['push', 'upshot', 'master'])
    })
}

module.exports = sync
