const { h, when, computed, Value } = require('mutant')
const getContent = require('ssb-msg-content')

module.exports = function DarkCrystalRecombineShow ({ ritual, shardRecords, scuttle, modal }) {
  return computed([ritual, shardRecords], (ritual, records) => {
    if (!ritual) return
    
    const { quorum, root } = getContent(ritual)
    const recordsWithReplies = records.filter(r => r.replies.length > 0)
    
    const quorumMet = recordsWithReplies.length >= quorum
    
    const secretOpen = Value(false)

    const secret = Value('')
    const recombineError = Value(false)
    const recombining = Value(false)


    return h('section.recombine', [
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

    function performRecombine(rootId) {
      secretOpen.set(true) 
      recombining.set(true)  
      scuttle.recover.async.recombine(rootId, (err,s) => {
        recombining.set(false)
        if (err) {
          recombineError.set(err)
        }  else {
          secret.set(s)
        }
      })
    }

    function recombineModal() {
      return modal(
        h('div.secretModal', [
          when(recombineError,
            h('div.recombineError', [
              h('p', 'Error recombining!'),
              h('button -subtle', { 'ev-click': () => secretOpen.set(false) }, 'OK')
            ]),

            h('div.secret', [
              h('h3', 'Secret recovered successfully:'),
              h('span', secret),
              h('button -subtle', { 'ev-click': () => copyToClipboard(secret) }, 'Copy to clipboard'),
              h('button -subtle', { 'ev-click': () => secretOpen.set(false) }, 'OK')
            ])
          )
        ]), { isOpen: secretOpen }
      )
    }
  })
}


function copyToClipboard(text) {
  // TODO
  return true
}
