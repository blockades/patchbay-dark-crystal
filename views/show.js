const pull = require('pull-stream')
const { h, Array: MutantArray, map, throttle } = require('mutant')

function DarkCrystalShow ({ root, scuttle }) {
  const { name, version } = root.value.content
  const published = new Date(root.value.timestamp).toLocaleDateString()

  const backlinks = getBacklinks()
  return h('DarkCrystalShow', [
    h('div', [name, ' - ', version, ' - ', published]),
    map(backlinks, Msg, { comparer })
  ])

  function Msg (msg) {
    return h('pre', JSON.stringify(msg.value.content, null, 2))
  }

  function getBacklinks () {
    const store = MutantArray([])
    pull(
      scuttle.pull.backlinks(root.key, { live: true }),
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
