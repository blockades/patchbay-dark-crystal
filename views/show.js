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

const DarkCrystalRequestNew = require('./requests/new')
const DarkCrystalRequestShow = require('./requests/show')

const Timestamp = require('./component/timestamp')
const Recipient = require('./component/recipient')
const getContent = require('ssb-msg-content')

function DarkCrystalShow ({ root, scuttle, avatar, modal }) {
  const rootId = root.key

  const pageState = Struct({
    hasShards: false,
    showErrors: false,
    requesting: false,
    requested: false
  })

  const errors = Struct({
    requests: Value()
  })

  const rituals = getRitual()
  const shards = getShards()

  return h('DarkCrystalShow', [
    h('section.ritual', [
      map(rituals, (ritual) => {
        const { quorum, shards } = getContent(ritual)
        return h('section.ritual', [
          h('p', `Quorum required to reassemble: ${quorum}`)
        ])
      }),
      h('h3', 'Progress'),
      map(rituals, ProgressBar)
    ]),
    h('section.shards', [
      h('div.shard', [
        map(shards, Shard, { comparer }),
      ])
    ]),
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

    const requested = computed([state.requested], Boolean)

    return h('div.overview', [
      Recipient({ recp: recps[0], avatar }),
      Timestamp({ prefix: 'Sent on', timestamp }),
      when(requested(),
        DarkCrystalRequestShow({
          scuttle,
          modal,
          request
        })
      ),
      when(!requested(),
        DarkCrystalRequestNew({
          root,
          scuttle,
          modal,
          recps,
          state
        })
      )
    ])
  }

  function getBacklinks () {
    const store = Struct({
      ritual: Value(),
      shards: MutantArray([]),
      requests: MutantArray([]),
      replies: MutantArray([])
    })

    pull
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
          pull.through(request => console.log(pageState.requested())),
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
    const { quorum } = getContent(ritual)
    return h('progress', { 'style': { 'margin-left': '10px' }, min: 0, max: 1, value: (getReplies().getLength() / quorum) })
  }

  function getReplies () {
    var store = MutantArray([])
    pull(
      scuttle.recover.pull.replies(rootId, { live: true }),
      pull.filter(m => !m.sync),
      pull.drain(reply => store.push(reply))
    )
    return store
  }

  function getRitual () {
    const store = MutantArray([])
    pull(
      scuttle.ritual.pull.byRoot(rootId, { live: true }),
      pull.filter(m => !m.sync),
      pull.drain(ritual => store.push(ritual))
    )
    return store
  }
}

function comparer (a, b) {
  return a && b && a.key === b.key
}

module.exports = DarkCrystalShow
