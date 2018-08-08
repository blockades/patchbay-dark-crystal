const { h, when, computed } = require('mutant')
const getContent = require('ssb-msg-content')

const ProgressBar = require('../component/progress')

module.exports = function DarkCrystalRitualShow ({ ritual, shardRecords }) {
  return computed([ritual, shardRecords], (ritual, records) => {
    if (!ritual) return

    const { quorum, recps = [] } = getContent(ritual)
    const hasRequests = records.some(r => r.requests.length > 0)
    const recordsWithReplies = records.filter(r => r.replies.length > 0)

    console.log('rrr',recordsWithReplies);
    return h('section.ritual', [
      h('div.quorum', [
        h('span', 'Quorum required: '),
        h('strong', quorum)
      ]),
      when(hasRequests,
        ProgressBar({
          prepend: h('h3', 'Progress'),
          maximum: recps.length,
          middle: quorum,
          title: 'Replies:',
          records: recordsWithReplies
        })
      )
    ])
  })
}
