const { h, when, computed, Value, resolve } = require('mutant')
const getContent = require('ssb-msg-content')
const { clipboard } = require('electron')

const ProgressBar = require('../component/progress-bar')
const getRecp = require('../lib/get-recp')

module.exports = function DarkCrystalShardsSummary ({ ritual, shardRecords, scuttle, modal, avatar }) {
  const state = {
    recombining: Value(false),
    modalOpen: Value(false),
    secret: Value(),
    error: Value()
  }

  return computed([ritual, shardRecords], (ritual, records) => {
    if (!ritual) return

    const { quorum, root } = getContent(ritual)

    const hasRequests = records.some(r => r.requests.length > 0)
    const numReplies = records.filter(r => r.replies.length > 0).length
    const quorumMet = numReplies >= quorum

    return h('DarkCrystalShardsSummary', [
      h('section.custodians', [
        h('h3', 'Custodians'),
        h('div.custodians', [
          records.map(r => avatar(getRecp(r.shard)))
        ])
      ]),
      h('section.quorum', [
        h('h3', 'Quorum'),
        h('strong', quorum)
      ]),
      when(hasRequests,
        h('section.progress', [
          h('h3', 'Shards summoned'),
          ProgressBar({
            value: numReplies,
            maximum: Math.max(quorum, numReplies),
            title: 'Shards gathered'
          })
        ])
      ),
      when(quorumMet,
        h('section.recombine', [
          // h('span', 'Quorum reached!'),
          h('button -primary',
            { 'ev-click': () => performRecombine(root, state) },
            when(state.recombining,
              h('i.fa.fa-spinner.fa-pulse'),
              'Show secret'
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
