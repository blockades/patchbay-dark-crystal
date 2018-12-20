const pull = require('pull-stream')
const pullParamap = require('pull-paramap')
const { h, Value, computed } = require('mutant')
const set = require('lodash.set')
const get = require('lodash.get')

const Recipient = require('../../component/recipient')
const Timestamp = require('../../component/timestamp')

module.exports = function DarkCrystalForwardCrystalsIndex ({ scuttle, avatar, name, modal, forwardCrystalsShow }) {
  const state = {
    isLoading: Value(true),
    error: Value(),
    secret: Value(),
    secretLabel: Value(),
    modalOpen: Value(false),
    forwards: Value()
  }

  // forwards : {
  //   secretAuthor: FeedId,
  //   secretCreated: UnixTimestamp,
  //   root: roodId
  //   recombinable: boolean,
  //   forwards: [
  //     author: FeedId,
  //     timestamp: UnixTimestamp
  //   ]
  // }

  getForwards()
  watchForUpdates()

  return h('DarkCrystalForwardCrystalsIndex', [
    computed([state.isLoading, state.forwards], (isLoading, forwards) => {
      if (isLoading) return 'Loading...'
      return Object.values(forwards).map(Forward)
    })
  ])

  function Forward (crystal) {
    const {
      secretAuthor: feedId,
      secretCreated: timestamp
    } = crystal

    return h('div.crystal', [
      h('div.overview', { 'ev-click': (e) => forwardCrystalsShow({ crystal }) }, [
        h('div.avatar', avatar(feedId, 3)),
        h('div.name', name(feedId)),
        Timestamp({ timestamp })
      ])
    ])
  }

  function getForwards () {
    const newForwards = {}
    pull(
      // Would this be faster with reverse: true? (and sort afterwards)
      scuttle.forward.pull.fromOthers({ live: false }),
      // get only one forward per rootId
      pull.unique(msg => msg.value.content.root),
      pullParamap(getForwardDataBundles, 10),
      pull.collect((err) => {
        if (err) console.error(err)
        state.forwards.set(newForwards)
        state.isLoading.set(false)
      })
    )

    function getForwardDataBundles (msg, cb) {
      const root = get(msg, 'value.content.root')
      set(newForwards, [ root, 'root' ], root)
      pull(
        scuttle.forward.pull.fromOthersByRoot(root),
        pull.map(forward => {
          return {
            author: get(forward, 'value.author'),
            timestamp: get(forward, 'value.timestamp')
          }
        }),
        pull.collect((err, forwards) => {
          if (err) return cb(err)
          set(newForwards, [ root, 'forwards' ], forwards)
          // get the original secret message, if within follow graph
          scuttle.root.async.get(root, (err, rootMsg) => {
            if (!err) {
              set(
                newForwards,
                [ root, 'secretAuthor' ],
                get(rootMsg, 'author') || get(rootMsg, 'value.author')
              )
              set(
                newForwards,
                [ root, 'secretCreated' ],
                get(rootMsg, 'timestamp') || get(rootMsg, 'value.timestamp')
              )
            }
            if (forwards.length > 1) {
              // Test if we can recombine
              // TODO: handle v1 forwarded message (eg: Is this your secret '<garbage>'?)
              scuttle.recover.async.recombine(root, (err, secret) => {
                if (secret && !err) set(newForwards, [ root, 'recombinable' ], root)
                return cb(null)
              })
            } else {
              return cb(null)
            }
          })
        })
      )
    }
  }

  function watchForUpdates () {
    pull(
      scuttle.forward.pull.fromOthers({ live: true, old: false }),
      pull.filter(m => !m.sync),
      pull.drain(m => getForwards())
    )
  }
}
