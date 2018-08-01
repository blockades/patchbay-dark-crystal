module.exports = function Recipient ({ recp, avatar }) {
  if (typeof recp === 'string') { // assume it's myId
    return h('div.recp', [ avatar(recp, 'tiny') ])
  }

  return h('div.recp', [
    avatar(recp.link, 'tiny'),
    h('div.name', recp.name)
  ])
}

