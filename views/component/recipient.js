const { h } = require('mutant')

module.exports = function Recipient ({ recp, avatar }) {
  if (typeof recp === 'string') { // assume it's myId
    return h('Recipient', [ avatar(recp, 'tiny') ])
  }

  return h('Recipient', [
    avatar(recp.link, 'tiny'),
    h('div.name', recp.name)
  ])
}
