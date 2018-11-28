const pull = require('pull-stream')
pull.paramap = require('pull-paramap')
const { h, Value, computed } = require('mutant')
const set = require('lodash.set')
const getContent = require('ssb-msg-content')
const isRequest = require('scuttle-dark-crystal/isRequest')
const isReply = require('scuttle-dark-crystal/isReply')
// const sort = require('ssb-sort')

// const DarkCrystalShowShard = require('./show')

const RECEIVED = 'received'
const REQUESTED = 'requested'
const RETURNED = 'returned'

function DarkCrystalFriendsIndex (opts) {
  const {
    avatar = identity,
    name = identity,
    scuttle
  } = opts

  const state = {
    isLoading: Value(true),
    records: Value()
  }

  const refresh = () => getRecords({ scuttle, state })
  watchForUpdates({ scuttle, refresh })
  refresh()

  return h('DarkCrystalFriendsIndex', [
    computed([state.isLoading, state.records], (isLoading, records) => {
      if (isLoading) return 'Loading...' // mix: TODO improve this!

      return records.map(Friend)
    })
  ])

  function Friend ({ feedId, shards }) {
    return h('DarkCrystalFriendShards', [
      h('div.avatar', avatar(feedId, 6)),
      h('div.name', name(feedId)),
      h('div.shards', shards.map(Shard))
    ])
  }

  function Shard ({ root, state }) {
    const className = state.returned ? '-returned'
      : state.requested ? '-requested'
        : '-received'

    return h('i.DarkCrystalShard.fa.fa-diamond', {
      title: state.returned ? RETURNED
        : state.requested ? REQUESTED
          : RECEIVED,
      className
    })
  }
}

// switch (state) {
//   case RECEIVED:
//     return h('div.shard -received', [
//       h('div.avatar', avatar(author)),
//       h('div.name', name(author)),
//       h('button', { disabled: true, style: { visibility: 'hidden' } }, 'Return Shard'), // TODO
//       h('div.rts', new Date(timestamp).toLocaleDateString())
//     ])

//   case REQUESTED:
//     const returning = Value(false)
//     const returnShard = () => {
//       returning.set(true)
//       scuttle.recover.async.reply(requests[0], (err, data) => {
//         if (err) throw err

//         console.log('shard returned', data)
//         getRecords() // refresh the view
//       })
//     }

//     return h('div.shard -requested', [
//       h('div.avatar', avatar(author)),
//       h('div.name', name(author)),
//       when(returning,
//         h('div.info'),
//         h('div.info', [
//           h('i.fa.fa-warning'), ' - shard requested'
//         ])
//       ),
//       when(returning,
//         h('i.fa.fa-spinner.fa-pulse'),
//         h('button -primary', { 'ev-click': returnShard }, 'Return Shard')
//       ),
//       h('div.rts', new Date(timestamp).toLocaleDateString())
//     ])

//   case REPLIED:
//     return h('div.shard -replied', [
//       h('div.avatar', avatar(author)),
//       h('div.name', name(author)),
//       h('div.info', '(returned)'),
//       h('div.rts', new Date(timestamp).toLocaleDateString())
//     ])
// }

function getRecords ({ scuttle, state }) {
  const newRecords = {
    // [author]: {
    //   [shard]: {
    //     requested,
    //     returned
    //   }
    // }
  }

  pull(
    // mix: TODO write a tigher query which gets only data needed
    scuttle.shard.pull.fromOthers({ reverse: true, live: false }),
    pull.paramap((shard, done) => {
      const { root } = getContent(shard)
      // root is the unique key for a shard

      pull(
        scuttle.root.pull.backlinks(root),
        pull.filter(m => getContent(m).root === root), // root.pull.backlinks should perhaps do this for us
        pull.collect((err, thread) => {
          if (err) return done(err)

          set(newRecords, [shard.value.author, root, 'requested'], thread.some(isRequest))
          set(newRecords, [shard.value.author, root, 'returned'], thread.some(isReply))

          // mix: TODO this is really crude / not water tight
          // If we ensure invites and replies have `branch` we can sort accurately
          // and make sure we're replied to the most recent request (will be more relevant with ephemeral keys)
          // sort(thread).reverse().find(isRequest) // most recent request

          done(null)
        })
      )
    }, 10), // "width 3"
    pull.collect((err) => {
      if (err) return console.error(err)

      // dict to collection
      const newRecordsArray = namedFlatten(newRecords, { keyName: 'feedId', valName: 'shards' })
        .map(({ feedId, shards }) => {
          return {
            feedId,
            shards: namedFlatten(shards, { keyName: 'root', valName: 'state' })
          }
        })
        .sort((a, b) => {
          // sort friends with 'active' shards to the top
          const aActive = a.shards.find(s => !s.state.requested)
          const bActive = b.shards.find(s => !s.state.requested)
          if (aActive && bActive) return 0
          if (aActive) return -1
          if (bActive) return +1
          return 0
        })

      // shape:
      // [
      //   { feedId, shards: [ { rootId, state: { requested, replied } }, {}, ... ]},
      //   { ... },
      // ]

      state.records.set(newRecordsArray)
      state.isLoading.set(false)
    })
  )
}

function namedFlatten (obj, { keyName, valName }) {
  return Object.keys(obj)
    .sort((a, b) => a < b ? -1 : 1)
    .map(key => {
      return { [keyName]: key, [valName]: obj[key] }
    })
}

function watchForUpdates ({ scuttle, refresh }) {
  // when any new messages come int related to this root, just get all the data again and write over it.
  // triggering a big render of who page...
  pull(
    scuttle.shard.pull.fromOthers({ live: true, old: false }),
    pull.filter(m => !m.sync),
    pull.drain(m => refresh())
  )

  // watch for others requests
  pull(
    scuttle.recover.pull.requests({ live: true, old: false }),
    pull.filter(m => !m.sync),
    pull.drain(m => refresh())
  )
}

function identity (id) { return id }

module.exports = DarkCrystalFriendsIndex
