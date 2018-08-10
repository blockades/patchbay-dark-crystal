const { h } = require('mutant')
const getContent = require('ssb-msg-content')
const sort = require('ssb-sort')

const Recipient = require('../component/recipient')
const Timestamp = require('../component/timestamp')
const DarkCrystalRequestNew = require('../requests/new')
const getRecp = require('../lib/get-recp')

module.exports = function DarkCrystalShardsRecord ({ root, record, scuttle, modal, avatar, msg }) {
  const { shard, requests, replies } = record

  const recp = getRecp(shard)
  const recoveryHistory = sort([...requests, ...replies])

  return h('DarkCrystalShardsRecord', [
    h('div.ShardDetails', [
      Recipient({ recp, avatar }),
      Timestamp({ timestamp: shard.value.timestamp })
    ]),
    h('div.history', [
      h('h3', 'Requests / Replies'),
      recoveryHistory.map(msg => {
        const author = msg.value.author
        const { body } = getContent(msg)

        return h('div.historyItem', [
          Recipient({ recp: author, avatar }),
          Timestamp({ timestamp: msg.value.timestamp }),
          body
        ])
      })
    ]),
    DarkCrystalRequestNew({ root, scuttle, modal, recipients: [recp] }, console.log)
  ])
}
