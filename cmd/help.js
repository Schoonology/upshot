function help(argv, options, loader) {
  var text

  if (options._[0] && (text = loader.loadManual(options._[0]))) {
    return console.log(text)
  }

  return console.log(loader.loadManual('upshot'))
}

module.exports = help
