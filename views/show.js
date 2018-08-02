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
    loaded: false,
    hasShards: false,
    requesting: false,
    showErrors: false,
    requested: false
  })

  const errors = Struct({
    requests: Value()
  })

  const requests = getRequests()
  const shards = getShards()

  const warningOpen = Value(false)

  const warningModal = modal(
    h('Warning', [
      h('span', 'Are you sure?'),
      h('button -subtle', { 'ev-click': () => warningOpen.set(false) }, 'Cancel'),
      h('button -subtle', { 'ev-click': () => sendRequests() }, 'OK'),
    ]), {
      isOpen: warningOpen
    }
  )

  const buttonWithModal = h('div', [
    h('button -primary', { 'ev-click': (e) => warningOpen.set(true) }, 'Request'),
    warningModal
  ])

  const canRequest = computed(
    [state.loaded, state.hasShards, state.requesting, state.requested],
    (loaded, hasShards, requesting, requested) => loaded && hasShards && !requesting && !requested
  )

  return h('DarkCrystalShow', [
    map(shards, renderShard, { comparer }),
    when(canRequest, buttonWithModal)
  ])

  function renderShard (msg) {
    const { recps = [] } = msg.value.content

    return h('Shard', [
      h('i.fa.fa-diamond'),
      Recipient({ recp: recps[0], avatar })
    ])
  }

  function getRequests () {
    const store = MutantArray([])
    pull(
      scuttle.recover.pull.requests(rootId, { live: true }),
      pull.filter(m => !m.sync),
      pull.through(m => resolve(state.requested) ? null : state.requested.set(true)),
      pull.drain(m => store.push(m))
    )
    // How can I get this to be as a result of the query if its { live: true } and there are no records?
    state.loaded.set(true)
    return store
  }

  function getShards () {
    const store = MutantArray([])
    pull(
      scuttle.shard.pull.byRoot(rootId, { live: true }),
      pull.filter(m => !m.sync),
      pull.through(m => state.hasShards.set(true)),
      pull.drain(m => store.push(m))
    )
    return store
  }

  function sendRequests () {
    state.requesting.set(true)
    scuttle.recover.async.request(rootId, (err, requests) => {
      if (err) {
        errors.requests.set(err)
        state.requesting.set(false)
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
