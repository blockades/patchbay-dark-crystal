const pull = require('pull-stream')
const pullParamap = require('pull-paramap')
const { h, Value, computed, when } = require('mutant')
const set = require('lodash.set')
const get = require('lodash.get')
const { performRecombine, RecombineModal } = require('./shards/recombine')

module.exports = function forward ({ scuttle, avatar, modal }) {
  const state = {
    isLoading: Value(true),
    forwards: Value(),
    recombining: Value(false),
    error: Value(),
    secret: Value(),
    modalOpen: Value(false)
  }

  const refresh = () => getForwards({ scuttle, state })
  // watchForUpdates({ scuttle, refresh })
  refresh()

  return h('DarkCrystalCrystalsIndex', [
    computed([state.isLoading, state.forwards], (isLoading, forwards) => {
      if (isLoading) return 'Loading...'
      return Object.values(forwards).map(Forward)
    })
  ])

  function Forward (msg) {
    return h('div.crystal', [
      h('div.overview', { 'ev-click': () => {} }, [
        when(msg.secretAuthor, h('div.secretAuthor', avatar(msg.secretAuthor))),
        msg.forwardMsgs.map(m => h('i.DarkCrystalShard.fa.fa-diamond', {})),
        when(msg.secretCreated, h('div.created', new Date(msg.secretCreated).toLocaleDateString())),
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
      scuttle.forward.pull.fromOthers({ live: false }),
      // get only one forward per rootId
      pull.unique(msg => msg.value.content.root),
      // should this be multiple separate maps?
      pullParamap((msg, cb) => {
        const root = get(msg, 'value.content.root')
        pull(
          scuttle.forward.pull.byRoot(root),
          pull.collect((err, forwardMsgs) => {
            if (err) return cb(err)
            set(newForwards, [ root, 'forwardMsgs' ], forwardMsgs)

            // test if we can recombine
            scuttle.recover.async.recombine(root, (err, secret) => {
              if (err) return cb(null)
              if (secret) set(newForwards, [ root, 'recombinable' ], root)

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
                return cb(null)
              })
            })
          })
        )
      }),
      pull.collect((err) => {
        if (err) console.error(err)
        state.forwards.set(newForwards)
        state.isLoading.set(false)
      })
    )
  }
}
