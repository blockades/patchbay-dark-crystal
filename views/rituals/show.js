const { h, when, computed, Value } = require('mutant')
const getContent = require('ssb-msg-content')

const ProgressBar = require('../component/progress')

module.exports = function DarkCrystalRitualShow ({ ritual, shardRecords, scuttle, modal }) {
  return computed([ritual, shardRecords], (ritual, records) => {
    if (!ritual) return

    const { quorum, root } = getContent(ritual)
    const hasRequests = records.some(r => r.requests.length > 0)
    const recordsWithReplies = records.filter(r => r.replies.length > 0)
    // const quorumMet = recordsWithReplies.length >= quorum
    const quorumMet = true 
    
    const secretOpen = Value(false)


    const secret = Value('')
    const recombineError = Value(false)
    const recombining = Value(false)

    function performRecombine(rootId) {
      secretOpen.set(true) 
      recombining.set(true)  
      scuttle.recover.async.recombine(rootId, (err,s) => {
        recombining.set(false)
        if (err) {
          // error.set(err)
          recombineError.set(true)
          // secretOpen.set(false)
        }  else {
          secret.set(s)
        }
      })
    }

    function recombineModal() {
      return modal(
        h('div.secretModal', [
          when(recombineError, 
            h('p', 'Error recombining!'),

            h('div.secret', [
              h('h3', 'Secret recovered successfully:'),
              // h('span', secret),
              h('button -subtle', { 'ev-click': () => copyToClipboard('') }, 'Copy to clipboard'),
              h('button -subtle', { 'ev-click': () => secretOpen.set(false) }, 'OK')
            ])
          )
        ])
      ), { isOpen: secretOpen }
    }

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
          h('button -primary', 
            { 'ev-click': () => performRecombine(root) }, 
            when(recombining,
              h('i.fa.fa-spinner.fa-pulse'),
              'Recombine shards'
            )
          )
        ])
      ),
      when(secretOpen, 
        recombineModal() 
      )
    ])
  })
}


function copyToClipboard(text) {
  // TODO
  return true
}
