var spawn = require('child_process').spawn
  , https = require('https')
  , os = require('os')
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

function requestOfGit(options) {
  var deferred = when.defer()
    , request

  options = options || {}

  request = https.request({
    method: options.method || 'POST',
    hostname: 'api.github.com',
    path: options.path || '/',
    auth: !!options.username ? options.username + ':' + options.password : null
  })

  request.setHeader('User-Agent', 'Upshot/1.0')
  if (options.token) {
    request.setHeader('Authorization', 'token ' + options.token)
  }
  request.end(JSON.stringify(options.body || {}))

  request.on('error', deferred.reject)
  request.on('response', function (response) {
    var body = ''

    response.on('data', function (chunk) {
      body += chunk
    })

    response.on('end', function () {
      try {
        body = JSON.parse(body)
      } catch(e) {
        deferred.reject(e)
      }

      deferred.resolve({
        statusCode: response.statusCode,
        body: body
      })
    })
  })

  return deferred.promise
}

/**
 * Retrieves a gist-scoped OAuth token, returning a promise to be resolved
 * with that token or rejected with an appropriate error.
 */
function getToken(username, password) {
  return requestOfGit({
    method: 'POST',
    path: '/authorizations',
    username: username,
    password: password,
    body: {
      scopes: ['gist'],
      note: 'Upshot access token for ' + os.hostname(),
      note_url: 'https://github.com/Schoonology/upshot'
    }
  })
    .then(function (response) {
      if (response.statusCode !== 201) {
        return when.reject('GitHub login failed.')
      }

      if (typeof response.body.token !== 'string' || !response.body.token) {
        return when.reject('Bad token from GitHub.')
      }

      return response.body.token
    })
}

/**
 * Creates a new Gist with the given token and data.
 */
function createGist(token, data) {
  var files = {}

  files[config.filename] = { content: 'Welcome to Upshot!' }

  return requestOfGit({
    method: 'POST',
    path: '/gists',
    token: token,
    body: {
      files: files,
      description: 'Upshot',
      'public': false
    }
  })
    .then(function (response) {
      if (response.statusCode !== 201) {
        return when.reject('Creating a Gist failed.')
      }

      return response.body
    })
}

/**
 * Retrieves the Gists associated with the given token.
 */
function getAllGists(token) {
  return requestOfGit({
    method: 'GET',
    path: '/gists',
    token: token
  })
    .then(function (response) {
      if (response.statusCode !== 200) {
        return when.reject('Retrieving Gists failed.')
      }

      return response.body
    })
}

/*!
 * Export the public helper functions.
 */
module.exports = {
  pSpawn: pSpawn,
  git: git,
  prompt: prompt,
  getToken: getToken,
  createGist: createGist,
  getAllGists: getAllGists
}
