var fs = require('fs')
  , util = require('util')
  , sh = require('shelljs')
  , when = require('when')
  , nodefn = require('when/node/function')
  , common = require('../lib/common')
  , config = require('../lib/config')

function init(argv, options, loader) {
  var start

  if (config.init) {
    console.log('Upshot already initialized.')
    return
  }

  if (config.token) {
    start = when.resolve(config.token)
  } else {
    start = common.prompt([{
      name: 'username',
      message: 'GitHub username:'
    }, {
      type: 'password',
      name: 'password',
      message: 'GitHub password:'
    }])
      .then(function (answers) {
        return common.getToken(answers.username, answers.password)
      })
  }


  return start
    .then(function (token) {
      config.token = token
      config.save()

      if (config.gitUrl) {
        return when.resolve(config)
      }

      return common.createGist(token)
    })
    .then(function (gist) {
      config.viewUrl = gist.viewUrl
      config.gitUrl = gist.gitUrl
      config.save()

      sh.mkdir('-p', config.root)

      return common.git('init')
    })
    .then(function () {
      return common.git(['remote', 'add', 'upshot', config.gitUrl])
    })
    .then(function () {
      return common.git(['pull', 'upshot', 'master'])
    })
    .then(function (code) {
      if (code !== 0) {
        return when.reject('Pull failed.')
      }

      fs.appendFileSync(config.editPath, '')
      config.init = true
      config.save()
    })
}

module.exports = init
