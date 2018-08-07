const { h, computed, when } = require('mutant')
const getContent = require('ssb-msg-content')

const ProgressBar = require('../component/progress')

module.exports = function DarkCrystalRitualShow ({ ritual, replies, requests }) {
  return computed(ritual, ritual => {
    if (!ritual) return

    const { quorum, recps = [] } = getContent(ritual)

    const hasRequests = computed(requests,
      (requests) => requests ? requests.length > 0 : null
    )

    return h('section.ritual', [
      h('p', `Quorum required to reassemble: ${quorum}`),
      computed(requests,
        (requests) => {
          if (!requests) return
          const prepend = h('h3', 'Progress')
          return ProgressBar({
            prepend,
            maximum: recps.length,
            middle: quorum,
            title: 'Replies:',
            records: replies
          })
        }
      )
    ])
  })
}
