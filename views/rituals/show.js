const { h, when, computed } = require('mutant')
const getContent = require('ssb-msg-content')

const ProgressBar = require('../component/progress')

module.exports = function DarkCrystalRitualShow ({ ritual, shardRecords, scuttle }) {
  return computed([ritual, shardRecords], (ritual, records) => {
    if (!ritual) return

    const { quorum, root } = getContent(ritual)
    const hasRequests = records.some(r => r.requests.length > 0)
    const recordsWithReplies = records.filter(r => r.replies.length > 0)
    const quorumMet = recordsWithReplies.length >= quorum
    
    return h('section.ritual', [
      h('div.quorum', [
        h('span', 'Quorum required: '),
        h('strong', quorum)
      ]),
      when(hasRequests,
        ProgressBar({
          prepend: h('h3', 'Progress'),
          maximum: records.length,
          middle: quorum,
          title: 'Replies:',
          records: recordsWithReplies
        })
      ),
      when(quorumMet,
        h('div.recombine', [
          h('span', 'Quorum reached!'),
          h('button -primary', { 'ev-click': () => performRecombine(root, scuttle) }, 'Recombine shards')
        ])
      )
    ])
  })
}

function performRecombine(rootId, scuttle) {
  // where is this html ending up? 
  scuttle.recover.async.recombine(rootId, (err,secret) => {
    if (err) return h('p', 'Error recombining!')
    return modal(
      h('div.secret', [
        h('h3', 'Secret recovered successfully:'),
        h('span', secret),
        h('button -subtle', { 'ev-click': () => copyToClipboard(secret) }, 'Copy to clipboard'),
        h('button -subtle', { 'ev-click': () => secretOpen.set(false) }, 'OK')
      ]), { isOpen: secretOpen }
    )
  })
}

function copyToClipboard(text) {
  // TODO
  return true
}
