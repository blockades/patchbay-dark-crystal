const pull = require('pull-stream')
const { h, Array: MutantArray, map, throttle } = require('mutant')

module.exports = function CrystalsIndex (opts) {
  const {
    scuttle,
    routeTo
  } = opts

  const roots = getRoots()
  const forwards = getForwards()

  return h('CrystalsIndex', [
    h('DarkCrystalCrystalsIndex', [ map(roots, Root, { comparer }) ]),
    h('div.forwards', [ map(forwards, Forward, { comparer }) ])
  ])

  function Root (msg) {
    return h('div.crystal', [
      h('div.overview', { 'ev-click': () => routeTo(msg) }, [
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

  function Forward (msg) {
    return h('div.forward', [
      h('div.sent', new Date(msg.value.timestamp).toLocaleDateString())
    ])
  }

  function getForwards () {
    const store = MutantArray([])

    pull(
      scuttle.forward.pull.fromOthers({ live: true }),
      pull.filter(m => !m.sync),
      // get only one forward per rootId
      pull.unique(msg => msg.value.content.rootId),
      pull.drain(forward => store.insert(forward, 0))
    )
    return throttle(store, 100)
  }
}

function comparer (a, b) {
  return a && b && a.key === b.key
}
