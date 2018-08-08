const pull = require('pull-stream')
const { h, Array: MutantArray, Value, Struct, computed } = require('mutant')

const Recipient = require('../component/recipient')
const Timestamp = require('../component/timestamp')

const DarkCrystalRequestShow = require('../requests/show')
const DarkCrystalRequestNew = require('../requests/new')

module.exports = function DarkCrystalShardShow ({ root, scuttle, modal, avatar, msg }) {
  const rootId = root.key
  const { value: { timestamp, content: { recps = [] } } } = msg

  const store = Struct({
    requesting: Value(false),
    requested: Value(false),
    request: Value()
  })

  pull(
    scuttle.recover.pull.requests(rootId, { live: true }),
    pull.filter(m => !m.sync),
    pull.filter(req => req.value.content.recps.includes(recps[0])),
    pull.drain(request => {
      store.request.set(request)
    })
  )

  return h('div.shard', [
    h('div.overview', [
      Recipient({ recp: recps[0], avatar }),
      Timestamp({ prefix: 'Sent on', timestamp }),
      computed([store.request], (msg) => {
        if (msg) return DarkCrystalRequestShow({ root, scuttle, msg })
        else return DarkCrystalRequestNew({ root, scuttle, modal, store, recps })
      })
    ])
  ])
}
