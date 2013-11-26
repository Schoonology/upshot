var https = require('https')
  , spawn = require('child_process').spawn
  , config = require('./config')
  , util = require('util')
  , inquirer = require('inquirer')
  , when = require('when')

/**
 * Runs the specified executable in `options.cwd` with `argv` as its arguments.
 * If `options.cwd` is not specified, `process.cwd()` is used instead.
 */
function pSpawn(path, argv, options) {
  var deferred = when.defer()
    , env = {}

  if (argv == null) {
    argv = []
  }

  if (!Array.isArray(argv)) {
    argv = [argv]
  }

  util._extend(env, options && options.env)
  util._extend(env, process.env)

  options = {
    env: env,
    cwd: (options && options.cwd) || config.root,
    stdio: 'inherit'
  }

  spawn(path, argv, options)
    .on('error', function (err) {
      deferred.reject(err)
    })
    .on('exit', function (code) {
      deferred.resolve(code)
    })

  return deferred.promise
}

/**
 * pSpawn git.
 */
function git(argv, options) {
  return pSpawn('git', argv, options)
}

/**
 * Promisified inquirer.
 */
function prompt(questions) {
  var deferred = when.defer()

  inquirer.prompt(questions, function (answers) {
    deferred.resolve(answers)
  })

  return deferred.promise
}

/**
 * Retrieves a gist-scoped OAuth token, returning a promise to be resolved
 * with that token or rejected with an appropriate error.
 */
function getToken(username, password) {
  var deferred = when.defer()
    , request

  request = https.request({
    method: 'POST',
    hostname: 'api.github.com',
    path: '/authorizations',
    auth: username + ':' + password
  })

  request.setHeader('User-Agent', 'Upshot/1.0')
  request.end(JSON.stringify({
    scopes: ['gist'],
    note: 'Upshot access token',
    note_url: 'https://github.com/Schoonology/upshot'
  }))

  request.on('response', function (response) {
    var body = ''

    response.on('data', function (chunk) {
      body += chunk
    })

    response.on('end', function () {
      console.log('OAuth response: %s', body)

      if (response.statusCode !== 201) {
        return deferred.reject('GitHub login failed.')
      }

      try {
        body = JSON.parse(body)
      } catch (e) {
        deferred.reject(e)
      }

      if (typeof body.token !== 'string' || !body.token) {
        return deferred.reject('Bad token from GitHub.')
      }

      deferred.resolve(body.token)
    })
  })
  request.on('error', function (err) {
    deferred.reject(err)
  })

  return deferred.promise
}

/**
 * Creates a new Gist with the given token and data.
 */
function createGist(token, data) {
  var deferred = when.defer()
    , files = {}
    , request

  files[config.filename] = { content: 'Welcome to Upshot!' }

  request = https.request({
    method: 'POST',
    hostname: 'api.github.com',
    path: '/gists'
  })

  request.setHeader('User-Agent', 'Upshot/1.0')
  request.setHeader('Authorization', 'token ' + token)
  request.end(JSON.stringify({
    files: files,
    description: 'Upshot',
    'public': false
  }))

  request.on('response', function (response) {
    var body = ''

    response.on('data', function (chunk) {
      body += chunk
    })

    response.on('end', function () {
      console.log('Create response: %s', body)

      if (response.statusCode !== 201) {
        return deferred.reject('Creating a Gist failed.')
      }

      try {
        body = JSON.parse(body)
      } catch (e) {
        deferred.reject(e)
      }

      deferred.resolve({
        gitUrl: util.format('git@github.com:%s.git', body.id),
        viewUrl: body.html_url
      })
    })
  })
  request.on('error', function (err) {
    deferred.reject(err)
  })

  return deferred.promise
}

/*!
 * Export the public helper functions.
 */
module.exports = {
  pSpawn: pSpawn,
  git: git,
  prompt: prompt,
  getToken: getToken,
  createGist: createGist
}
