const pull = require('pull-stream')
const { h, Array: MutantArray, map, throttle, Value, when } = require('mutant')


function DarkCrystalIndex (opts) {
  const {
    scuttle,
    routeTo,
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
      h('div.overview', { 'ev-click': () => routeTo({ page: 'dark-crystal/show', root: msg }) }, [
        h('div.name', msg.value.content.name),
        h('div.started', new Date(msg.value.timestamp).toLocaleDateString())
      ])
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
