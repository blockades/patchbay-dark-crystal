const { h, Value, computed, Array: MutantArray, resolve } = require('mutant')
const pull = require('pull-stream')

const Recipients = require('../component/recipients')
const Recipient = require('../component/recipient')
const AreYouSure = require('../component/are-you-sure')

module.exports = function DarkCrystalForwardNew (opts) {
  const {
    scuttle,
    suggest,
    avatar = identity,
    name = identity,
    onCancel = console.log,
    feedId,
    shards
  } = opts

  const state = {
    confirmed: Value(false),
    completed: Value(false), // TODO: Render a success or failure message and reset the UI back to home page...
    recps: MutantArray([])
  }

  return h('DarkCrystalForwardNew', [
    h('section.inputs', [
      h('div.select', [
        h('label.recps', 'Forward to:'),
        Recipients({
          state,
          suggest,
          avatar,
          maxRecps: 1,
          placeholder: `a known alternative identity / trusted party`,
          onChange: (e) => state.confirmed.set(false)
        })
      ])
    ]),
    h('section.description', [
      h('div.from', [
        h('span', 'Shards belonging to...'),
        Recipient({ recp: feedId, avatar })
      ]),
      h('div.between', [
        h('i.fa.fa-arrow-right.fa-lg')
      ]),
      computed([state.recps], (recps) => {
        if (recps.length < 1) return
        return h('div.to', [
          Recipient({ recp: recps[0], avatar }),
          h('span', 'will be forwarded to...')
        ])
      })
    ]),
    h('section.actions', [
      FirstCheck(),
      SecondCheck()
    ])
  ])

  function FirstCheck () {
    return computed([state.confirmed, state.recps], (confirmed, recps) => {
      const recp = recps[0]
      if (confirmed || !recp) return

      // For clarity's sake...
      const source = { name: resolve(name(feedId)), id: feedId }
      const destination = { name: recp.name || 'unknown', id: recp.link }

      return AreYouSure({
        message: `Are you sure that ${source.name} and ${destination.name} are the same person?`,
        onSubmit: (e) => state.confirmed.set(true),
        onCancel
      })
    })
  }

  function SecondCheck () {
    return computed([state.confirmed, state.recps], (confirmed, recps) => {
      const recp = recps[0]
      if (!confirmed || !recp) return

      return AreYouSure({
        message: 'Final Check. Do you have sufficient consent to proceed?',
        onSubmit: (e) => publishForwards(recp.link),
        onCancel: (e) => state.confirmed.set(false)
      })
    })
  }

  function publishForwards (feedId) {
    pull(
      pull.values(shards),
      pull.map(shard => shard.root),
      pull.asyncMap((root, cb) => scuttle.forward.async.publish(root, feedId, cb)),
      pull.collect((err, forwards) => {
        // TODO handle this better
        if (err) return console.err(err)

        // Just exit modal for the moment...
        onCancel()
      })
    )
  }
}

function identity (id) { return id }
