const pull = require('pull-stream')
const { h, Value, computed, throttle } = require('mutant')
const Recipient = require('../component/recipient')

module.exports = function DarkCrystalLocalPeersIndex (opts) {
  const {
    localPeers,
    avatar,
    name
  } = opts

  return h('LocalPeers', [
    computed(throttle(localPeers(), 1000), peers => {
      if (!peers.length) return h('p', 'No local peers (on same wifi/ LAN)')

      return peers.map(peer => Recipient({ recp: peer, avatar, name }))
    })
  ])
}
