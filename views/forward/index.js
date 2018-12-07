const pull = require('pull-stream')
const pullParamap = require('pull-paramap')
const { h, Value, computed } = require('mutant')
const set = require('lodash.set')
const transform = require('lodash.transform')
const sortBy = require('lodash.sortby')
const getContent = require('ssb-msg-content')
const { isForward } = require('ssb-dark-crystal-schema')

const DarkCrystalForwardNew = require('./new')

module.exports = function DarkCrystalForwardIndex (opts) {
  const {
    scuttle,
    suggest,
    avatar = identity,
    name = identity,
    newForward = noop
  } = opts

  const state = {
    isLoading: Value(true),
    friends: Value(),
    selectedFriend: Value()
  }

  const refresh = () => getRecords({ scuttle, state })
  watchForUpdates({ scuttle, refresh })
  refresh()

  return h('DarkCrystalForwardIndex', [
    computed([state.isLoading, state.friends], (isLoading, friends) => {
      if (isLoading) return 'Loading...'

      return friends.map(Friend)
    })
  ])

  function Friend ({ feedId, shards }) {
    return h('DarkCrystalFriendShards', [
      h('div.avatar', avatar(feedId, 6)),
      h('div.name', name(feedId)),
      h('button', { 'ev-click': (e) => newForward({ shards, feedId }) }, 'Forward')
    ])
  }
}

function getRecords ({ scuttle, state }) {
  const newRecords = {
    // [author]: {
    //   [root]: {
    //     receivedAt,
    //     forwardId,
    //     sentAt
    //   }
    // }
  }

  pull(
    scuttle.shard.pull.fromOthers({ reverse: true, live: false }),
    pullParamap((shard, done) => {
      const { root } = getContent(shard) // root is the unique key for a shard
      set(newRecords, [shard.value.author, root, 'receivedAt'], new Date(shard.timestamp).toLocaleDateString())

      pull(
        scuttle.root.pull.backlinks(root, { reverse: true }),
        pull.filter(m => getContent(m).root === root), // root.pull.backlinks should perhaps do this for us
        pull.collect((err, thread) => {
          if (err) return done(err)

          // Grab all forwards that already exist for this root,
          // it might be the case we've already forwarded shards to a new identity
          var forward = thread.find(isForward)
          if (forward) {
            set(newRecords, [shard.value.author, root, 'forward'], forward.key)
            set(newRecords, [shard.value.author, root, 'sentAt'], forward.timestamp.toLocaleDateString())
          } 

          done(null)
        })
      )
    }, 10), // "width 10"
    pull.collect((err) => {
      if (err) return console.error(err)

      // transform is a reduce for object. Iterator signature (acc, value, key, obj)
      var newRecordsArray = transform(newRecords, (acc, shards, feedId) => {
        acc.push({
          feedId,
          shards: transform(shards, (acc, state, root) => {
            acc.push(Object.assign({ root }, state))
          }, [])
        })
      }, [])

      // newRecordsArray Shape
      // [
      //   { feedId, shards: [ { rootId, receivedAt, forwardId, sentAt }, { rootId, receivedAt, forwardId, sentAt } ] },
      //   { feedId, shards: [ { rootId, receivedAt, forwardId, sentAt }, ... ] },
      // ]

      state.friends.set(newRecordsArray)
      state.isLoading.set(false)
    })
  )
}

function watchForUpdates ({ scuttle, refresh }) {
  // watch shards
  pull(
    scuttle.shard.pull.fromOthers({ live: true, old: false }),
    pull.filter(m => !m.sync),
    pull.drain(m => refresh())
  )

  // TODO add watch forwards here...
}

function identity (id) { return id }
function noop () {}
