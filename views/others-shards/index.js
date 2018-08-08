const pull = require('pull-stream')
const { h, Array: MutantArray, map, throttle, Value } = require('mutant')

// const DarkCrystalShowShard = require('./show')

function DarkCrystalFriendsIndex (opts) {
  const {
    avatar = identity,
    name = identity,
    scuttle
  } = opts

  const shards = getShards()
  return h('DarkCrystalFriendsIndex', [
    map(shards, Shard, { comparer })
  ])

  function Shard (msg) {
    const show = Value(false)

    return h('div.shard', { 'ev-click': () => show.set(!show()) }, [
      h('div.overview', [
        h('div.avatar', avatar(msg.value.author)),
        h('div.name', name(msg.value.author)),
        h('div.received', new Date(msg.value.timestamp).toLocaleDateString())
      ])
      // when(show,
      //   DarkCrystalShowShard({ root: msg, scuttle })
      // )
    ])
  }

  function getShards () {
    const store = MutantArray([])
    pull(
      scuttle.shard.pull.friends({ live: true }),
      pull.filter(m => !m.sync),
      pull.drain(root => store.insert(root, 0))
    )
    return throttle(store, 100)
  }
}

function identity (id) { return id }

function comparer (a, b) {
  return a && b && a.key === b.key
}

module.exports = DarkCrystalFriendsIndex
