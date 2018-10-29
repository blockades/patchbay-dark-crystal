const { h } = require('mutant')

module.exports = function Recipient ({ recp, avatar }) {
  if (typeof recp === 'string') { // assume it's myId
    return h('DarkCrystalRecipient', [ avatar(recp) ])
  }

  return h('DarkCrystalRecipient', [
    avatar(recp.link),
    h('div.name', recp.name)
  ])
}
