var opener = require('opener')
  , common = require('../lib/common')
  , config = require('../lib/config')

function open(argv, options, loader) {
  if (!config.init) {
    return loader.run(['init'])
  }

  if (!process.stdout.isTTY) {
    return process.stdout.write(config.editPath + '\n')
  }

  if (config.editor) {
    return common.pSpawn(config.editor, [config.editPath])
  }

  opener(config.editPath)
}

module.exports = open
