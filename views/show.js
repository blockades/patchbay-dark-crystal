const pull = require('pull-stream')
const { h, Array: MutantArray, map, throttle } = require('mutant')

function DarkCrystalShow ({ root, scuttle }) {
  const backlinks = getBacklinks()

  return h('DarkCrystalShow', [
    map(backlinks, Msg, { comparer })
  ])

  function Msg (msg) {
    return h('pre', JSON.stringify(msg.value.content, null, 2))
  }

  function getBacklinks () {
    const store = MutantArray([])
    pull(
      scuttle.root.pull.backlinks(root.key, { live: true }),
      pull.filter(m => !m.sync),
      pull.drain(m => store.push(m))
    )
    return throttle(store, 100)
  }
}

function comparer (a, b) {
  return a && b && a.key === b.key
}

module.exports = DarkCrystalShow
