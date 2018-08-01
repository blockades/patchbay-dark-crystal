const pull = require('pull-stream')
const { h, Array: MutantArray, map, throttle, Value, when } = require('mutant')

const DarkCrystalShow = require('./show')

function DarkCrystalIndex (opts) {
  const {
    scuttle,
    avatar,
    modal
  } = opts

  const roots = getRoots()

  return h('DarkCrystalIndex', [
    map(roots, Root, { comparer })
  ])

  function Root (msg) {
    const show = Value(false)

    return h('div.crystal', [
      h('div.overview', { 'ev-click': () => show.set(!show()) }, [
        h('div.name', msg.value.content.name),
        h('div.started', new Date(msg.value.timestamp).toLocaleDateString())
      ]),
      when(show,
        DarkCrystalShow({
          scuttle,
          root: msg,
          avatar,
          modal,
        })
      )
    ])
  }

  function getRoots () {
    const store = MutantArray([])
    pull(
      scuttle.root.pull.mine({ live: true }),
      pull.filter(m => !m.sync),
      pull.drain(root => store.insert(root, 0))
    )
    return throttle(store, 100)
  }
}

function comparer (a, b) {
  return a && b && a.key === b.key
}

module.exports = DarkCrystalIndex
