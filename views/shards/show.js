const pull = require('pull-stream')
const { h, Value, Struct, computed } = require('mutant')

const Recipient = require('../component/recipient')
const Timestamp = require('../component/timestamp')
const DarkCrystalRequestNew = require('../requests/new')

module.exports = function DarkCrystalShardShow ({ root, scuttle, modal, avatar, msg }) {
  const {
    value: {
      timestamp,
      content: {
        recps = []
      }
    }
  } = msg

  // TODO: base on whether a request exists,
  // requires request data mapped onto shard data
  const state = Struct({
    requesting: Value(false),
    requested: Value(false)
  })

  return h('div.shard', [
    h('div.overview', [
      Recipient({ recp: recps[0], avatar }),
      Timestamp({ prefix: 'Sent on', timestamp }),
      computed(
        [state.requested],
        (bool) => bool ? null : DarkCrystalRequestNew({ root, scuttle, modal, state, recps })
      )
    ])
  ])
}
