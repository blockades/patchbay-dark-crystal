const Recipient = require('../component/recipient')
const { h, computed } = require('mutant')

module.exports = function LocalPeers (opts) {
  const {
    peers,
    avatar,
    name
  } = opts

  return h('div.peers', [
    computed(peers(), local => {
      if (!local.length) return h('p', 'No local peers connected')
      return local.map(feedId => Recipient({ recp: feedId, avatar, name }))
    })
  ])
}
