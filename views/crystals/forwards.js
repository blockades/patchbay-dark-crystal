const pull = require('pull-stream')
const pullParamap = require('pull-paramap')
const { h, Array: MutantArray, Value, map, computed, throttle, when } = require('mutant')
const set = require('lodash.set')

module.exports = function forward ({ scuttle, avatar }) {
  const state = {
    isLoading: Value(true),
    forwards: Value()
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
        // h('div.something', JSON.stringify(msg))
        // h('div.secretAuthor', avatar(msg.SecretAuthor) ]),
        msg.forwardMsgs.map(m => h('i.DarkCrystalShard.fa.fa-diamond', {})),
        // h('div.forwardShards', [ map(getForwardShards(msg.value.content.root), ForwardShard, { comparer }) ]),
        // h('div.sent', new Date(msg.value.timestamp).toLocaleDateString()),
        when(msg.recombinable, h('button -primary', { 'ev-click': () => {} }, 'Recombine'))
      ])
    ])
  }

  function getForwards () {
    const newForwards = {}
    pull(
      scuttle.forward.pull.fromOthers({ live: false }),
      // get only one forward per rootId
      pull.unique(msg => msg.value.content.root),
      // pullParamap((msg, cb) => {
      //   scuttle.root.pull.get(msg.value.content.root, (err, rootMsg) => {
      //     if (err) console.log(err)
      //     console.log(rootMsg)
      //     cb(null)
      //     // TODO: use lodash get
      //     // set(newForwards, [ msg.value.content.root, 'secretAuthor' ], roots[0].value.author)
      //     // set(newForwards, [ msg.value.content.root, 'secretCreated' ], roots[0].value.timestamp)
      //   })
      // }),
      pullParamap((msg, cb) => {
        pull(
          scuttle.forward.pull.byRoot(msg.value.content.root),
          pull.collect((err, forwardMsgs) => {
            if (err) return cb(err)
            set(newForwards, [ msg.value.content.root, 'forwardMsgs' ], forwardMsgs)
            scuttle.recover.async.recombine(msg.value.content.root, (err, secret) => {
              if (err) return cb(null)
              if (secret) set(newForwards, [ msg.value.content.root, 'recombinable' ], true)
              return cb(null)
            })
          })
        )
      }),
      // test if we can recombine
      // pullParamap((msg, cb) => {
      //   scuttle.recover.async.recombine(msg.value.content.root, (err, secret) => {
      //     if (err) return cb(null, msg)
      //     // if (secret) return cb(null, Object.assign({ recombinable: true }, msg))
      //     if (secret) return cb(null, msg)
      //   })
      // }),
      pull.collect((err) => {
        if (err) console.error(err)
        state.forwards.set(newForwards)
        state.isLoading.set(false)
      })
    )
  }
}
//   function ForwardShard (msg) {
//     return h('div.author', avatar(msg.value.author))
//   }
// }
//
// function comparer (a, b) {
//   return a && b && a.key === b.key
