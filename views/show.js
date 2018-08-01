const pull = require('pull-stream')
const {
  h,
  Array: MutantArray,
  map,
  throttle,
  resolve,
  computed,
  Value,
  when,
  Struct
} = require('mutant')

const Recipient = require('./component/recipient')

function DarkCrystalShow ({ root, scuttle, avatar, modal }) {
  const rootId = root.key

  const state = Struct({
    loaded: Value(false),
    requesting: false,
    showErrors: false,
    requested: false
  })

  const errors = Struct({
    requests: Value()
  })

  // const requests = getRequests()
  const shards = getShards()

  const warningOpen = Value(false)
  const warning = h('Warning', [
    h('span', 'Are you sure?'),
    h('button -subtle', { 'ev-click': () => warningOpen.set(false) }, 'Cancel'),
    h('button -subtle', { 'ev-click': sendRequests }, 'OK'),
  ])

  const warningModal = modal(warning, { isOpen: warningOpen })

  const canRequest = computed(
    [state.loaded, state.requesting, state.requested],
    (loaded, requesting, requested) => loaded && (!requesting || !requested)
  )

  return h('DarkCrystalShow', [
    map(shards, renderShard, { comparer }),
    when(canRequest,
      h('button -primary', { 'ev-click': () => warningOpen.set(true) }, 'Request'),
      warningModal
    )
  ])

  function renderShard (msg) {
    const { recps = [] } = msg.value.content

    return h('Shard', [
      h('i.fa.fa-diamond'),
      Recipient({ recp: recps[0], avatar })
    ])
  }

  function getBacklinks () {
    const store = MutantArray([])
    pull(
      scuttle.shard.pull.byRoot(rootId, { live: true }),
      pull.filter(m => !m.sync),
      pull.drain(m => store.push(m))
    )
    return throttle(store, 100)
  }

  function getRequests () {
    const store = MutantArray([])
    pull(
      scuttle.recover.pull.requests(rootId, { live: true }),
      pull.filter(m => !m.sync),
      pull.through(m => state.requested.set(true)), // if there are any requests, we assume all have been sent
      pull.drain(m => store.push(m))
    )
    return throttle(store, 100)
  }

  function getShards () {
    const store = MutantArray([])
    pull(
      scuttle.shard.pull.byRoot(rootId, { live: true }),
      pull.filter(m => !m.sync),
      pull.drain(m => store.push(m))
    )
    return throttle(store, 100)
  }

  function sendRequests () {
    state.sendingRequests.set(true)
    scuttle.request.async.request(rootId, (err, requests) => {
      if (err) {
        state.requesting.set(false)
        errors.requests.set(err)
      }
      afterRequests()
    })
  }

  function afterRequests () {
    state.requested.set(true)
    state.requesting.set(false)
  }
}

function comparer (a, b) {
  return a && b && a.key === b.key
}

module.exports = DarkCrystalShow
