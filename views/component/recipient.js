const { h } = require('mutant')

module.exports = function Recipient ({ recp, avatar }) {
  if (typeof recp === 'string') { // assume it's myId
    return h('DarkCrystalRecipient', [ avatar(recp, 'tiny') ])
  }

  return h('DarkCrystalRecipient', [
    avatar(recp.link, 'tiny'),
    h('div.name', recp.name)
  ])
}
