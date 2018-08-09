const { h, when, computed, Value, resolve } = require('mutant')
const getContent = require('ssb-msg-content')
const { clipboard } = require('electron')

module.exports = function DarkCrystalRecombineShow ({ ritual, shardRecords, scuttle, modal }) {
  const state = {
    recombining: Value(false),
    modalOpen: Value(false),
    secret: Value(),
    error: Value()
  }

  return computed([ritual, shardRecords], (ritual, records) => {
    if (!ritual) return

    const { quorum, root } = getContent(ritual)

    const quorumMet = records
      .filter(r => r.replies.length > 0) // shards received
      .length >= quorum

    return h('section.recombine', [
      when(quorumMet,
        h('div.recombine', [
          h('span', 'Quorum reached!'),
          h('button -primary',
            { 'ev-click': () => performRecombine(root, state) },
            when(state.recombining,
              h('i.fa.fa-spinner.fa-pulse'),
              'Recombine shards'
            )
          )
        ])
      ),
      RecombineModal(modal, state)
    ])
  })

  function performRecombine (rootId, { recombining, error, secret, modalOpen }) {
    recombining.set(true)

    scuttle.recover.async.recombine(rootId, (err, s) => {
      if (err) error.set(err)
      else secret.set(s)

      recombining.set(false)
      modalOpen.set(true)
    })
  }
}

function RecombineModal (modal, state) {
  const { error, modalOpen, secret } = state

  const content = h('DarkCrystalSecret', [
    when(error,
      h('div.recombineError', [
        h('h1', [
          'Error combining shards!!!'
        ]),
        h('pre', computed(error, e => (e || '').toString())),
        h('button -subtle', { 'ev-click': () => modalOpen.set(false) }, 'OK')
      ]),
      h('div.secret', [
        h('h3', 'Secret recovered successfully:'),
        h('pre', secret),
        h('button -subtle', { 'ev-click': () => clipboard.writeText(resolve(secret)) }, [
          h('i.fa.fa-copy'),
          'Copy to clipboard'
        ]),
        h('button -subtle', { 'ev-click': () => modalOpen.set(false) }, 'OK')
      ])
    )
  ])

  return modal(content, { isOpen: modalOpen })
}
