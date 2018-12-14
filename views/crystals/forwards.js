const pull = require('pull-stream')
const { h, Array: MutantArray, map, throttle, when } = require('mutant')

module.exports = function forward ({ scuttle, avatar }) {
  const forwards = getForwards()

  return h('DarkCrystalCrystalsIndex', [ map(forwards, Forward, { comparer }) ])

  function Forward (msg) {
    return h('div.crystal', [
      h('div.overview', [
        h('div.forwardShards', [ map(getForwardShards(msg.value.content.root), ForwardShard, { comparer }) ]),
        h('div.sent', new Date(msg.value.timestamp).toLocaleDateString()),
        when(msg.recombinable, h('button -primary', { 'ev-click': () => {} }, 'Recombine'))
      ])
    ])
  }

  function getForwards () {
    const store = MutantArray([])

    pull(
      scuttle.forward.pull.fromOthers({ live: true }),
      pull.filter(m => !m.sync),
      // get only one forward per rootId
      pull.unique(msg => msg.value.content.root),
      // test if we can recombine
      pull.asyncMap(function (msg, cb) {
        scuttle.recover.async.recombine(msg.value.content.rootId, (err, secret) => {
          if (err) return cb(null, msg)
          if (secret) return cb(null, Object.assign({ recombinable: true }, msg))
        })
      }),
      pull.drain(forward => store.insert(forward, 0))
    )
    return throttle(store, 100)
  }

  function getForwardShards (rootId) {
    const store = MutantArray([])

    pull(
      scuttle.forward.pull.byRoot(rootId, { live: true }),
      pull.filter(m => !m.sync),
      pull.drain(forward => store.insert(forward, 0))
    )
    return throttle(store, 100)
  }

  function ForwardShard (msg) {
    return h('div.author', avatar(msg.value.author))
  }
}

function comparer (a, b) {
  return a && b && a.key === b.key
}
