const { h, map } = require('mutant')
const Recipient = require('./recipient')
const RecipientInput = require('./recipient-input')

function Recipients (opts) {
  const {
    state,
    suggest,
    avatar
  } = opts

  return h('DarkCrystalRecipients', [
    map(state.recps, recp => Recipient({ recp, avatar })),
    RecipientInput({ state, suggest })
  ])
}

module.exports = Recipients
