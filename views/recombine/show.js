const { h, when, computed, Value, resolve } = require('mutant')
const getContent = require('ssb-msg-content')
const { clipboard } = require('electron')

module.exports = function DarkCrystalRecombineShow ({ ritual, shardRecords, scuttle, modal }) {
  return computed([ritual, shardRecords], (ritual, records) => {
    if (!ritual) return

    const { quorum, root } = getContent(ritual)

    const quorumMet = records
      .filter(r => r.replies.length > 0) // shards received
      .length >= quorum

    const recombining = Value(false)
    const modalOpen = Value(false)

    const secret = Value()
    const recombineError = Value()

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
      RecombineModal()
    ])

    function performRecombine (rootId) {
      recombining.set(true)

      scuttle.recover.async.recombine(rootId, (err, s) => {
        if (err) recombineError.set(err)
        else secret.set(s)

        recombining.set(false)
        modalOpen.set(true)
      })
    }

    function RecombineModal () {
      return modal(
        h('DarkCrystalSecret', [
          when(recombineError,
            h('div.recombineError', [
              h('h3', 'Error recombining!'),
              // TODO: What exactly was the error?
              // h('span',recombineError),
              h('button -subtle', { 'ev-click': () => modalOpen.set(false) }, 'OK')
            ]),
            h('div.secret', [
              h('h3', 'Secret recovered successfully:'),
              h('pre', secret),
              // TODO: not sure how to pass the secret observable to the clipboard function
              h('button -subtle', { 'ev-click': () => clipboard.writeText(resolve(secret)) }, [
                h('i.fa.fa-copy'),
                'Copy to clipboard'
              ]),
              h('button -subtle', { 'ev-click': () => modalOpen.set(false) }, 'OK')
            ])
          )
        ]), { isOpen: modalOpen }
      )
    }
  })
}
