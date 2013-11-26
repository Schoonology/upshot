var fs = require('fs')
  , util = require('util')
  , sh = require('shelljs')
  , when = require('when')
  , nodefn = require('when/node/function')
  , common = require('../lib/common')
  , config = require('../lib/config')

function sync(argv, options, loader) {
  if (config.init) {
    console.log('Upshot already initialized.')
    return
  }

  return common.prompt([{
    name: 'username',
    message: 'GitHub username:'
  }, {
    type: 'password',
    name: 'password',
    message: 'GitHub password:'
  }])
    .then(function (answers) {
      if (config.token) {
        return when.resolve(config.token)
      }

      return common.getToken(answers.username, answers.password)
    })
    .then(function (token) {
      config.token = token

      if (config.gitUrl) {
        return when.resolve(config)
      }

      return common.createGist(token)
    })
    .then(function (gist) {
      config.viewUrl = gist.viewUrl
      config.gitUrl = gist.gitUrl

      sh.mkdir('-p', config.root)

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
