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
const getContent = require('ssb-msg-content')

function DarkCrystalShow ({ root, scuttle, avatar, modal }) {
  const rootId = root.key

  const pageState = Struct({
    hasShards: false,
    showErrors: false,
    requested: false
  })

  const errors = Struct({
    requests: Value()
  })

  const shards = getShards()
  const ritual = getRitual()

  return h('DarkCrystalShow', [
    map(shards, Shard, { comparer }),
    // commented for the sake of anyone viewing
    // when(pageState.requested,
    //   ProgressBar(ritual)
    // )
  ])

  function Shard (shard) {
    const {
      request,
      value: {
        timestamp,
        content: {
          recps = []
        }
      }
    } = shard

    const state = Struct({
      requested: Boolean(request),
      showWarning: false
    })

    return h('Shard', [
      h('i.fa.fa-diamond'),
      Recipient({ recp: recps[0], avatar }),
      h('div.created', `Sent on ${new Date(timestamp).toLocaleDateString()}`),
      Request()
    ])

    function Request () {
      return h('div', [
        when(resolve(state.requested),
          h('div.sent', `Requested on ${new Date(shard.request && shard.request.value && shard.request.value.timestamp).toLocaleDateString()}`)
        ),
        when(!resolve(state.requested),
          h('div', [
            h('button -primary', { 'ev-click': (e) => state.showWarning.set(true) }, 'Request'),
            modal(
              h('Warning', [
                h('span', 'Are you sure?'),
                h('button -subtle', { 'ev-click': () => state.showWarning.set(false) }, 'Cancel'),
                h('button -subtle', { 'ev-click': () => sendRequest(recps) }, 'OK'),
              ]), {
                isOpen: state.showWarning
              }
            )
          ])
        )
      ])
    }

    function sendRequest (recipients) {
      pageState.requesting.set(true)
      scuttle.recover.async.request(rootId, recipients, (err, requests) => {
        if (err) {
          errors.requests.set(err)
          pageState.requesting.set(false)
        }
        afterRequests()
      })
    }

    function afterRequests () {
      pageState.requested.set(true)
      pageState.requesting.set(false)
    }
  }

  function getShards () {
    const store = MutantArray([])
    pull(
      scuttle.shard.pull.byRoot(rootId, { live: true }),
      pull.filter(m => !m.sync),
      pull.through(shard => pageState.hasShards.set(true)),
      pull.asyncMap((shard, callback) => {
        pull(
          scuttle.recover.pull.requests(rootId),
          pull.filter(m => !m.sync),
          pull.through(request => resolve(pageState.requested) ? null : pageState.requested.set(true)),
          pull.take(1),
          pull.drain(request => {
            shard.request = request
            callback(null, shard)
          }, () => {
            callback(null, shard)
          })
        )
      }),
      pull.drain(shard => store.push(shard))
    )
    return store
  }

  function ProgressBar(ritual) {
    return when(resolve(ritual),
      h('progress', { 'style': { 'margin-left': '10px' }, min: 0, max: 1, value: progress })
    )

    function progress (total) {
      var store = MutantArray([])
      // resolving the observable breaks getContent (cause its null)...
      const { quorum } = getContent(ritual())
      pull(
        scuttle.recover.pull.replies(rootId, { live: true }),
        pull.filter(m => !m.sync),
        pull.drain(reply => store.push(reply))
      )
      return store.getLength() / (quorum || 0)
    }
  }

  function getRitual () {
    const store = Value()
    pull(
      scuttle.ritual.pull.byRoot(rootId, { live: true }),
      pull.filter(m => !m.sync),
      pull.drain(ritual => store.set(ritual))
    )
    return store
  }
}

function comparer (a, b) {
  return a && b && a.key === b.key
}

module.exports = DarkCrystalShow
