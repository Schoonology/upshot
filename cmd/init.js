var fs = require('fs')
  , util = require('util')
  , sh = require('shelljs')
  , when = require('when')
  , nodefn = require('when/node/function')
  , common = require('../lib/common')
  , config = require('../lib/config')

function sync(argv, options, loader) {
  return common.prompt([{
    name: 'username',
    message: 'Git username:'
  }, {
    type: 'input',
    name: 'id',
    message: 'Gist ID:'
  }])
    .then(function (answers) {
      config.viewUrl = util.format('https://gist.github.com/%s/%s', answers.username, answers.id)
      config.gitUrl = util.format('git@github.com:%s.git', answers.id)

      sh.mkdir('-p', config.root)

      console.log('Fetching from %s...', config.gitUrl)

      return common.git('init')
    })
    .then(function () {
      return common.git(['remote', 'rm', 'upshot'])
    })
    .then(function () {
      return common.git(['remote', 'add', 'upshot', config.gitUrl])
    })
    .then(function () {
      return common.git(['pull', 'upshot', 'master'])
    })
    .then(function () {
      fs.appendFileSync(config.editPath, '')
      config.init = true

      config.save()
    })
}

module.exports = sync
