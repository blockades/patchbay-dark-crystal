const { h, Value, when, computed, Array: MutantArray, resolve } = require('mutant')
const pull = require('pull-stream')

const Recipient = require('../component/recipient')
const Timestamp = require('../component/timestamp')

module.exports = function DarkCrystalForwardsCollection (opts) {
  const {
    crystal,
    scuttle,
    avatar = identity,
    name = identity,
    onCancel = console.log
  } = opts

  const {
    forwardMsgs: forwards,
    recombinable,
    secretAuthor: author,
    secretCreated: createdAt
  } = crystal

  return h('DarkCrystalForwardsCollection', [
    h('section.content', [
      Recipient({ recp: author, avatar, name }),
      Timestamp({ timestamp: createdAt }),
      forwards.map(m => h('i.DarkCrystalShard.fa.fa-diamond', {})),
      when(recombinable, h('button -primary',
        'Recombine'
        // { 'ev-click': () => performRecombine(msg.recombinable, scuttle, state) },
        // when(state.recombining, h('i.fa.fa-spinner.fa-pulse'), 'Recombine')
      )),
      // RecombineModal(modal, state)
    ])
  ])
}

function identity (id) { return id }
