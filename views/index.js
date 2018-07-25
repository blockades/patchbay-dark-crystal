const pull = require('pull-stream')
const { h, Array: MutantArray, map, throttle, Value, when } = require('mutant')

const DarkCrystalShow = require('./show')

function DarkCrystalIndex (opts) {
  const {
    scuttle
  } = opts

  const roots = getRoots()
  return h('DarkCrystalIndex', [
    map(roots, Root, { comparer })
  ])

  function Root (msg) {
    const show = Value(false)

    return h('div.crystal', { 'ev-click': () => show.set(!show()) }, [
      h('div.overview', [
        h('div.name', msg.value.content.name),
        h('div.started', new Date(msg.value.timestamp).toLocaleDateString())
      ]),
      when(show,
        DarkCrystalShow({ root: msg, scuttle })
      )
    ])
  }

  function getRoots () {
    const store = MutantArray([])
    pull(
      scuttle.root.pull.roots({ live: true }),
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
