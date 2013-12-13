var fs = require('fs')
  , util = require('util')
  , sh = require('shelljs')
  , when = require('when')
  , nodefn = require('when/node/function')
  , common = require('../lib/common')
  , config = require('../lib/config')

function gistToConfig(gist) {
  return {
    gitUrl: util.format('git@github.com:%s.git', gist.id),
    viewUrl: gist.html_url
  }
}

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

      return common.getAllGists(config.token)
    })
    .then(function (gists) {
      gists = gists
        .filter(function (gist) {
          return gist.description.slice(0, 6).toLowerCase() === 'upshot'
        })

      if (gists.length === 0) {
        return {}
      }

      // This option is for a new Gist.
      gists.push({
        id: null,
        description: 'None (Create New)'
      })

      return common.prompt({
        name: 'gist',
        type: 'list',
        message: 'Use which existing Gist?',
        choices: gists.map(function (gist) {
          return {
            name: gist.description + (gist.id ? ' (' + gist.id + ')' : ''),
            value: gist
          }
        })
      })
    })
    .then(function (answers) {
      if (answers.gist && answers.gist.id) {
        return answers.gist
      }

      return common.createGist(config.token)
    })
    .then(function (gist) {
      gist = gistToConfig(gist)

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
