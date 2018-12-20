const pull = require('pull-stream')
const pullParamap = require('pull-paramap')
const { h, Value, computed, when } = require('mutant')
const set = require('lodash.set')
const get = require('lodash.get')
const { performRecombine, RecombineModal } = require('./shards/recombine')

module.exports = function forward ({ scuttle, avatar, modal }) {
  const state = {
    isLoading: Value(true),
    recombining: Value(false),
    error: Value(),
    secret: Value(),
    secretLabel: Value(),
    modalOpen: Value(false),
    forwards: Value()
  }

  // forwards : {
  //   secretAuthor: FeedId,
  //   secretCreated: UnixTimestamp,
  //   recombinable: rootId,
  //   forwardMsgs: [
  //       Forward
  //   ]
  // }

  getForwards()
  watchForUpdates()

  return h('DarkCrystalCrystalsIndex', [
    computed([state.isLoading, state.forwards], (isLoading, forwards) => {
      if (isLoading) return 'Loading...'
      return Object.values(forwards).map(Forward)
    })
  ])

  function Forward (msg) {
    return h('div.crystal', [
      // TODO: clicking takes you to a page with more detail, move recombine button there
      h('div.overview', { 'ev-click': () => {} }, [
        when(msg.secretAuthor, h('div.secretAuthor', avatar(msg.secretAuthor))),
        when(msg.secretCreated, h('div.created', new Date(msg.secretCreated).toLocaleDateString())),
        // one diamond icon per shard you hold (these could be mini-avatars of the forwarders)
        msg.forwardMsgs.map(m => h('i.DarkCrystalShard.fa.fa-diamond', {})),
        when(msg.recombinable, h('button -primary',
          { 'ev-click': () => performRecombine(msg.recombinable, scuttle, state) },
          when(state.recombining, h('i.fa.fa-spinner.fa-pulse'), 'Recombine')
        )),
        RecombineModal(modal, state)
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
      pull(
        scuttle.forward.pull.fromOthersByRoot(root),
        pull.collect((err, forwardMsgs) => {
          if (err) return cb(err)
          set(newForwards, [ root, 'forwardMsgs' ], forwardMsgs)
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
            if (forwardMsgs.length > 1) {
              // Test if we can recombine
              // TODO: handle v1 forwarded message (eg: Is this your secret '<garbage>'?)
              scuttle.recover.async.recombine(root, (err, secret) => {
                // is this a bit misleading?  recombinable is not boolean it contains the roodId
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
