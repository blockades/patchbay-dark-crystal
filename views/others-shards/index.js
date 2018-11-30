const pull = require('pull-stream')
const pullParamap = require('pull-paramap')
const { h, Value, computed } = require('mutant')
const set = require('lodash.set')
const transform = require('lodash.transform')
const getContent = require('ssb-msg-content')
const isRequest = require('scuttle-dark-crystal/isRequest')
const isReply = require('scuttle-dark-crystal/isReply')
// const sort = require('ssb-sort')

// const DarkCrystalShowShard = require('./show')

// NOTE - these are currently connect to mcss
const RECEIVED = 'received'
const REQUESTED = 'requested'
const RETURNED = 'returned'

function DarkCrystalFriendsIndex (opts) {
  const {
    avatar = identity,
    name = identity,
    showFriend = noop,
    scuttle
  } = opts

  const state = {
    isLoading: Value(true),
    friends: Value(),
    selectedFriend: Value()
  }

  const refresh = () => getRecords({ scuttle, state })
  watchForUpdates({ scuttle, refresh })
  refresh()

  return h('DarkCrystalFriendsIndex', [
    computed([state.isLoading, state.friends], (isLoading, friends) => {
      if (isLoading) return 'Loading...' // mix: TODO improve this!

      return friends.map(Friend)
    })
  ])

  function Friend ({ feedId, shards }) {
    return h('DarkCrystalFriendShards',
      {
        'ev-click': () => {
          state.selectedFriend.set(feedId)
          showFriend({ friends: state.friends, selectedFriend: state.selectedFriend })
        }
      },
      [
        h('div.avatar', avatar(feedId, 6)),
        h('div.name', name(feedId)),
        h('div.shards', shards.map(Shard))
      ]
    )
  }

  function Shard ({ root, receivedAt, state }) {
    const className = '-' + state
    const title = `${receivedAt}\n${root}`

    return h('i.DarkCrystalShard.fa.fa-diamond', {
      title,
      className
    })
  }
}

function getRecords ({ scuttle, state }) {
  const newRecords = {
    // [author]: {
    //   [shard]: { // shard.root
    //     receivedAt,
    //     state
    //   }
    // }
  }

  pull(
    // mix: TODO write a tigher query which gets only data needed
    scuttle.shard.pull.fromOthers({ reverse: true, live: false }),
    pullParamap((shard, done) => {
      const { root } = getContent(shard)
      // root is the unique key for a shard

      pull(
        scuttle.root.pull.backlinks(root),
        pull.filter(m => getContent(m).root === root), // root.pull.backlinks should perhaps do this for us
        pull.collect((err, thread) => {
          if (err) return done(err)

          set(newRecords, [shard.value.author, root, 'receivedAt'], new Date(shard.timestamp).toLocaleDateString())

          const state = thread.some(isReply) ? RETURNED
            : thread.some(isRequest) ? REQUESTED
              : RECEIVED
          set(newRecords, [shard.value.author, root, 'state'], state)

          // mix: TODO this is really crude / not water tight
          // If we ensure invites and replies have `branch` we can sort accurately
          // and make sure we're replied to the most recent request (will be more relevant with ephemeral keys)
          // sort(thread).reverse().find(isRequest) // most recent request

          done(null)
        })
      )
    }, 10), // "width 10"
    pull.collect((err) => {
      if (err) return console.error(err)

      // transform is a reduce for object. Iterator signature (acc, value, key, obj)
      const newRecordsArray = transform(newRecords, (acc, shards, feedId) => {
        const _shards = transform(shards, (acc, state, root) => {
          acc.push(Object.assign({ root }, state))
        }, [])

        acc.push({ feedId, shards: _shards })
      }, []).sort((a, b) => {
        // sort friends with 'active' shards to the top
        const aActive = a.shards.find(s => s.state === REQUESTED)
        const bActive = b.shards.find(s => s.state === REQUESTED)
        if (aActive && bActive) return 0
        if (aActive) return -1
        if (bActive) return +1
        return 0
      })

      // newRecordsArray Shape
      // [
      //   { feedId, shards: [ { rootId, receivedAt, state }, { rootId, receivedAt, state } ] },
      //   { feedId, shards: [ { rootId, receivedAt, state }, ... ] },
      // ]

      state.friends.set(newRecordsArray)
      state.isLoading.set(false)
    })
  )
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
function noop () {}

module.exports = DarkCrystalFriendsIndex
