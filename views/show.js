const pull = require('pull-stream')
const { h, Array: MutantArray, map, resolve, computed, Value, when, Struct } = require('mutant')

const isRitual = require('scuttle-dark-crystal/isRitual')
const isShard = require('scuttle-dark-crystal/isShard')
const { isInvite, isReply } = require('ssb-invite-schema')

const DarkCrystalRequestNew = require('./requests/new')
const DarkCrystalRequestShow = require('./requests/show')
const DarkCrystalRitualShow = require('./rituals/show')
const DarkCrystalShardShow = require('./shards/show')

function DarkCrystalShow ({ root, scuttle, avatar, modal }) {
  const rootId = root.key

  const store = Struct({
    ritual: Value(),
    shards: MutantArray([]),
    requests: MutantArray([]),
    replies: MutantArray([])
  })

  pull(
    scuttle.root.pull.backlinks(rootId, { live: true }),
    pull.filter(m => !m.sync),
    pull.drain(msg => {
      match(msg)
        .on(isRitual, ritual => store.ritual.set(ritual))
        .on(isShard, shard => store.shards.push(shard))
        .on(isInvite, request => store.requests.push(request))
        .on(isReply, reply => store.replies.push(reply))
    })
  )

  return h('DarkCrystalShow', [
    computed([store.ritual], (msg) => msg ? DarkCrystalRitualShow({ scuttle, msg }) : null),
    h('section.shards', map(
      store.shards,
      (msg) => DarkCrystalShardShow({ root, scuttle, modal, avatar, msg: msg }),
      { comparer }
    )),
    h('section.requests', map(
      store.requests,
      (msg) => DarkCrystalRequestShow({ root, scuttle, msg: msg }),
      { comparer }
    )),
    h('section.replies', map(
      store.replies,
      (msg) => h('Reply', reply),
      { comparer }
    ))
    // How can we blend the shards and requests (and replies) datasets & sections?
    // Requires mapping store.shards onto store.requests
    // But MutantArray([]).find is not a function despite documentation
    // Need to somehow match shard.recps against request.recps (and reply.recps next)
    // while they're still observables
  ])
}

function comparer (a, b) {
  return a && b && a.key === b.key
}

function matched (x) {
  return {
    on: () => matched(x),
    otherwise: () => x,
  }
}

function match (x) {
  return {
    on: (pred, fn) => (pred(x) ? matched(fn(x)) : match(x)),
    otherwise: fn => fn(x),
  }
}

module.exports = DarkCrystalShow

// function Shard (shard) {
//   const {
//     // request,
//     value: {
//       timestamp,
//       content: {
//         recps = []
//       }
//     }
//   } = shard

//   // MutantArray().find doesnt exist?! Despite documentation
//   const request = store.requests.find(r => {
//     console.log(r)
//     console.log(recps)
//     return r.value.content.recps.sort() === recps.sort()
//   })
//   console.log(request)

//   // const state = Struct({
//   //   requested: Boolean(request),
//   //   showWarning: false
//   // })

//   // const requested = computed([state.requested], Boolean)

//   return h('div.shard', [
//     h('div.overview', [
//       Recipient({ recp: recps[0], avatar }),
//       Timestamp({ prefix: 'Sent on', timestamp }),
//     ])
//   ])
// }

// when(
//   requested(),
//   DarkCrystalRequestShow({
//     scuttle,
//     modal,
//     request
//   }),
//   DarkCrystalRequestNew({
//     root,
//     scuttle,
//     modal,
//     recps,
//     state
//   })
// )

// function getBacklinks () {
//   const store = Struct({
//     ritual: Value(),
//     shards: MutantArray([]),
//     requests: MutantArray([]),
//     replies: MutantArray([])
//   })

//   pull(
//     scuttle.root.pull.backlinks(rootId, { live: true }),
//     pull.filter(m => !m.sync),
//     pull.drain(msg => {
//       match(msg)
//         .on(isRitual, ritual => store.ritual.set(ritual))
//         .on(isShard, shard => store.shards.push(shard))
//         .on(isInvite, request => store.requests.push(request))
//         .on(isReply, reply => store.replies.push(reply))
//     })
//   )

//   return store
// }

// function getShards () {
//   const store = MutantArray([])
//   pull(
//     scuttle.shard.pull.byRoot(rootId, { live: true }),
//     pull.filter(m => !m.sync),
//     pull.through(shard => pageState.hasShards.set(true)),
//     pull.asyncMap((shard, callback) => {
//       pull(
//         scuttle.recover.pull.requests(rootId),
//         pull.filter(m => !m.sync),
//         pull.through(request => resolve(pageState.requested) ? null : pageState.requested.set(true)),
//         pull.through(request => console.log(pageState.requested())),
//         pull.take(1),
//         pull.drain(request => {
//           shard.request = request
//           callback(null, shard)
//         }, () => {
//           callback(null, shard)
//         })
//       )
//     }),
//     pull.drain(shard => store.push(shard))
//   )
//   return store
// }

// function ProgressBar(ritual) {
//   const { quorum } = getContent(ritual)
//   return h('progress', { 'style': { 'margin-left': '10px' }, min: 0, max: 1, value: (getReplies().getLength() / quorum) })
// }

// function getReplies () {
  //   var store = MutantArray([])
  //   pull(
//     scuttle.recover.pull.replies(rootId, { live: true }),
  //     pull.filter(m => !m.sync),
//     pull.drain(reply => store.push(reply))
//   )
//   return store
// }

// function getRitual () {
  //   const store = MutantArray([])
//   pull(
//     scuttle.ritual.pull.byRoot(rootId, { live: true }),
//     pull.filter(m => !m.sync),
//     pull.drain(ritual => store.push(ritual))
//   )
//   return store
// }
