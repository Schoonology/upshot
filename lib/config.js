/*!
 * A dead-simple config loader for Upshot.
 */
var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , HOME = process.env.HOME || process.env.USERPROFILE
  , CONFIG_PATH = path.resolve(HOME, '.upshotrc')

/**
 * Creates a new instance of Config with an initial state provided as `obj`.
 *
 * @param {Object} obj
 */
function Config(obj) {
  if (!(this instanceof Config)) {
    return new Config(obj)
  }

  this.init = false
  this.root = path.resolve(HOME, '.upshot')
  this.filename = 'upshot.md'

  util._extend(this, obj)

  this._initHelpers()
}

/**
 * Synchronously loads the config, returning the loaded instance.
 */
Config.load = load
function load() {
  var cls = this
    , data

  if (fs.existsSync(CONFIG_PATH)) {
    data = JSON.parse(fs.readFileSync(CONFIG_PATH))
  }

  return cls(data)
}

/**
 * Synchronously saves the config, returning the saved instance.
 */
Config.prototype.save = save
function save() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(this, null, 2))

  return this
}

/**
 * Synchronously removes the config file, returning the previous instance.
 */
Config.prototype.clean = clean
function clean() {
  fs.unlinkSync(CONFIG_PATH)

  return this
}

/**
 * @private
 *
 * Defines helper properties, such as editPath.
 */
Config.prototype._initHelpers = _initHelpers
function _initHelpers() {
  var self = this

  Object.defineProperty(this, 'editPath', {
    get: function () {
      return path.join(self.root, self.filename)
    }
  })

  return self
}

/*!
 * Export `Config`.
 */
module.exports = Config.load()
