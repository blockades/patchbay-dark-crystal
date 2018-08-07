const { h } = require('mutant')
const getContent = require('ssb-msg-content')
const sort = require('ssb-sort')

const Recipient = require('../component/recipient')
const Timestamp = require('../component/timestamp')
const DarkCrystalRequestNew = require('../requests/new')

module.exports = function DarkCrystalShardShow ({ root, record, scuttle, modal, avatar, msg }) {
  const { shard, requests, replies } = record

  const recp = getRecp(shard)
  const recoveryHistory = sort([...requests, ...replies])

  return h('div.ShardRecord', [
    Recipient({ recp, avatar }),
    Timestamp({ prefix: 'Shard sent on', timestamp: shard.value.timestamp }),
    recoveryHistory.map(msg => {
      return h('div', [ // WORSE IS BETTER (i.e. anyone can improve this!)
        getContent(msg).type,
        ' - ',
        getContent(msg).body,
        Timestamp({ timestamp: msg.value.timestamp })
      ])
    }),
    DarkCrystalRequestNew({ root, scuttle, modal, recipients: [recp] }, console.log)
  ])
}

// TODO extract this into a scuttle-dc method if we use it a lot
function getRecp (shard) {
  return getContent(shard).recps
    .find(r => r !== shard.value.author)
}
