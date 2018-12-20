const Clipboard = require('./clipboard')

module.exports = function (opts) {
  const {
    error = Value(),
    modalOpen = Value(),
    secretLabel = Value(),
    secret = Value()
  } = opts

  return h('DarkCrystalSecret', when(error, error(), secret()))

  function secret () {
    return [
      h('h1', 'Your secret'),
      when(secretLabel, [ h('h3', 'Label'), h('pre', secretLabel) ]),
      h('h3', 'Secret'),
      h('pre', secret),
      h('div.actions', [
        Clipboard({ toCopy: secret }),
        h('button -subtle', { 'ev-click': () => modalOpen.set(false) }, 'close')
      ])
    ]
  }

  function error () {
    return [
      h('h1', [
        'Error combining shards!!!'
      ]),
      h('pre', computed(error, e => (e || '').toString())),
      h('div.actions', [
        h('button -subtle', { 'ev-click': () => modalOpen.set(false) }, 'close')
      ])
    ]
  }
}
