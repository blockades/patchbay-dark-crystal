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
              // TODO: get this fontawesome clipboard icon to display
              // h('i', { 'class': 'fas fa-copy' }) 
              h('button -subtle', { 'ev-click': () => copyToClipboard('cheese') }, 'Copy to clipboard' ),
              h('button -subtle', { 'ev-click': () => secretOpen.set(false) }, 'OK')
            ])
          )
        ]), { isOpen: secretOpen }
      )
    }
  })
}


function copyToClipboard(text) {
  // TODO:  is this the best way to copy to the clipboard?
  // const {clipboard} = require('electron')
  // clipboard.writeText('Example String')

  console.log('text to copy',text)
  var textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}
