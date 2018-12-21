const pull = require('pull-stream')
const pullParamap = require('pull-paramap')
const { h, Value, computed, Array: MutantArray } = require('mutant')
const set = require('lodash.set')
const get = require('lodash.get')
const transform = require('lodash.transform')

const Recipient = require('../../component/recipient')

const RECOVERED = 'recovered'
const WAITING = 'waiting'

module.exports = function DarkCrystalFriendsCrystalsIndex ({ scuttle, avatar, name, modal, friendsCrystal }) {
  const state = {
    isLoading: Value(true),
    error: Value(),
    secret: Value(),
    secretLabel: Value(),
    modalOpen: Value(false),
    friends: MutantArray([])
  }

  // friends: [
  //   {
  //     feedId,
  //     crystals: [
  //       { rootId, createdAt, forwards: [{ feedId, createdAt }, { feedId, createdAt }] }
  //       { rootId, forwards: ... }
  //     ]
  //   },
  //   {
  //     feedId,
  //     createdAt,
  //     crystals: ...
  //   }
  // ]

  getForwards()
  watchForUpdates()

  return h('DarkCrystalFriendsCrystalsIndex', [
    computed([state.isLoading, state.friends], (isLoading, friends) => {
      if (isLoading) return 'Loading...'
      return friends.map(Friend)
    })
  ])

  function Friend ({ feedId, crystals }) {
    return h('DarkCrystalFriendsCrystals', [
      h('div.avatar', avatar(feedId, 6)),
      h('div.name', name(feedId)),
      h('div.crystals', crystals.map(Crystal))
    ])
  }

  function Crystal (crystal) {
    const { createdAt, rootId } = crystal

    return h('div.crystal', { 'ev-click': (e) => friendsCrystal({ crystal }) }, [
      h('i.DarkCrystalCrystal.fa.fa-diamond', {
        title: `${new Date(createdAt).toLocaleString()}\n${rootId}`,
        className: crystal.state ? `-${crystal.state}` : null
      })
    ])
  }

  function getForwards () {
    const newForwards = {}
    const collection = {}

    // forwardsArray Shape
    // [
    //   {
    //     feedId,
    //     crystals: [
    //       { author, rootId, createdAt, forwards: [{ feedId, createdAt }, { feedId, createdAt }] }
    //       { author, rootId, forwards: ... }
    //     ]
    //   },
    //   {
    //     feedId,
    //     createdAt,
    //     crystals: ...
    //   }
    // ]

    pull(
      // Would this be faster with reverse: true? (and sort afterwards)
      scuttle.forward.pull.fromOthers({ live: false }),
      // get only one forward per rootId
      pull.unique(msg => msg.value.content.root),
      pullParamap(getForwardDataBundles, 10),
      pull.collect((err) => {
        if (err) console.error(err)

        var friendsWithCrystals = transform(collection, (acc, crystals, feedId) => {
          acc.push({
            feedId,
            crystals: transform(crystals, (acc, crystal, rootId) => (
              acc.push(Object.assign({}, crystal, { author: feedId, rootId })
            )), [])
          })
        }, [])

        state.friends.set(friendsWithCrystals)
        state.isLoading.set(false)
      })
    )

    function getForwardDataBundles (msg, cb) {
      // collection Shape
      // {
      //   feedId: {
      //     rootId: {
      //       createdAt, (UnixTimestamp)
      //       recombinable, (Boolean)
      //       forwards: [
      //         { feedId, createdAt }]
      //       ]
      //     },
      //     rootId: {
      //       ...
      //     }
      //   },
      //   feedId: {
      //     ...
      //   }
      // }

      const feedId = get(msg, 'value.author')
      const rootId = get(msg, 'value.content.root')

      pull(
        scuttle.forward.pull.fromOthersByRoot(rootId),
        pull.map(forward => ({
          author: get(forward, 'value.author'),
          timestamp: get(forward, 'value.timestamp')
        })),
        pull.collect((err, forwards) => {
          if (err) return cb(err)

          if (forwards.length > 0) {
            scuttle.root.async.get(rootId, (err, root) => {
              if (err) return cb(err)

              let author = get(root, 'author') || get(root, 'value.author')
              set(collection, [feedId, rootId, 'author'], author)

              let timestamp = get(root, 'timestamp') || get(root, 'value.timestamp')
              set(collection, [feedId, rootId, 'createdAt'], timestamp)

              set(collection, [feedId, rootId, 'forwards'], forwards)

              if (forwards.length > 0) {
                scuttle.recover.async.recombine(rootId, (err, secret) => {
                  if (err) return cb(err)

                  var state
                  if (Boolean(secret)) state = RECOVERED
                  else state = WAITING

                  set(collection, [feedId, rootId, 'recombinable'], Boolean(secret))
                  set(collection, [feedId, rootId, 'state'], state)

                  return cb(null)
                })
              } else {
                return cb(null)
              }
            })
          } else {
            return cb(null)
          }
        })
      )
    }

    // const root = get(msg, 'value.content.root')
    // set(newForwards, [ root, 'root' ], root)
    // pull(
    //   scuttle.forward.pull.fromOthersByRoot(root),
    //   pull.map(forward => {
    //     return {
    //       author: get(forward, 'value.author'),
    //       timestamp: get(forward, 'value.timestamp')
    //     }
    //   }),
    //   pull.collect((err, forwards) => {
    //     if (err) return cb(err)
    //     set(newForwards, [ root, 'forwards' ], forwards)
    //     // get the original secret message, if within follow graph
    //     scuttle.root.async.get(root, (err, rootMsg) => {
    //       if (err) return cb(err)

    //       if (!err) {
    //         set(
    //           newForwards,
    //           [ root, 'secretAuthor' ],
    //           get(rootMsg, 'author') || get(rootMsg, 'value.author')
    //         )
    //         set(
    //           newForwards,
    //           [ root, 'secretCreated' ],
    //           get(rootMsg, 'timestamp') || get(rootMsg, 'value.timestamp')
    //         )
    //       }
    //       if (forwards.length > 1) {
    //         // Test if we can recombine
    //         // TODO: handle v1 forwarded message (eg: Is this your secret '<garbage>'?)
    //         scuttle.recover.async.recombine(root, (err, secret) => {
    //           if (secret && !err) set(newForwards, [ root, 'recombinable' ], root)
    //           return cb(null)
    //         })
    //       } else {
    //         return cb(null)
    //       }
    //     })
    //   })
    // )
  }

  function watchForUpdates () {
    pull(
      scuttle.forward.pull.fromOthers({ live: true, old: false }),
      pull.filter(m => !m.sync),
      pull.drain(m => getForwards())
    )
  }
}
