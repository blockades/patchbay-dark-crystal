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
    hasShards: false,
    showErrors: false,
    requested: false
  })

  const errors = Struct({
    requests: Value()
  })

  const shards = getShards()

  return h('DarkCrystalShow', [
    map(shards, Shard, { comparer }),
  ])

  function Shard (msg) {
    const {
      request,
      value: {
        timestamp,
        content: {
          recps = []
        }
      }
    } = msg

    const shard = Struct({
      requested: Boolean(request),
      showWarning: false
    })

    return h('Shard', [
      h('i.fa.fa-diamond'),
      Recipient({ recp: recps[0], avatar }),
      h('div.created', `Sent on ${new Date(timestamp).toLocaleDateString()}`),
      Request({ msg, shard })
    ])
  }

  function Request ({ msg, shard }) {
    return h('div', [
      when(resolve(shard.requested),
        h('div.sent', `Requested on ${new Date(msg.request && msg.request.value && msg.request.value.timestamp).toLocaleDateString()}`)
      ),
      when(!resolve(shard.requested),
        h('div', [
          h('button -primary', { 'ev-click': (e) => shard.showWarning.set(true) }, 'Request'),
          modal(
            h('Warning', [
              h('span', 'Are you sure?'),
              h('button -subtle', { 'ev-click': () => shard.showWarning.set(false) }, 'Cancel'),
              h('button -subtle', { 'ev-click': () => sendRequests() }, 'OK'),
            ]), {
              isOpen: shard.showWarning
            }
          )
        ])
      )
    ])
  }

  function getShards () {
    const store = MutantArray([])
    pull(
      scuttle.shard.pull.byRoot(rootId, { live: true }),
      pull.filter(m => !m.sync),
      pull.through(shard => state.hasShards.set(true)),
      pull.asyncMap((shard, callback) => {
        pull(
          scuttle.recover.pull.requests(rootId),
          pull.filter(m => !m.sync),
          pull.through(request => resolve(state.requested) ? null : state.requested.set(true)),
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

  function sendRequest (recipients) {
    state.requesting.set(true)
    scuttle.recover.async.request(rootId, recipients, (err, requests) => {
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
