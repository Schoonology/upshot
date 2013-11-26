var spawn = require('child_process').spawn
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

module.exports = {
  pSpawn: pSpawn,
  git: git,
  prompt: prompt
}
