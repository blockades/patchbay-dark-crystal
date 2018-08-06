const pull = require('pull-stream')
const { h } = require('mutant')

const Recipient = require('../component/recipient')
const Timestamp = require('../component/timestamp')

module.exports = function DarkCrystalShardShow ({ root, scuttle, avatar, msg }) {
  const {
    value: {
      timestamp,
      content: {
        recps = []
      }
    }
  } = msg

  return h('div.shard', [
    h('div.overview', [
      Recipient({ recp: recps[0], avatar }),
      Timestamp({ prefix: 'Sent on', timestamp }),
      // Need to show DarkCrystalRequestNew here, but only if there isn't already request!
    ])
  ])
}
