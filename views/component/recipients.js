const { h, map } = require('mutant')
const Recipient = require('./recipient')
const RecipientInput = require('./recipient-input')

function Recipients (opts) {
  const {
    state,
    suggest,
    avatar,
    maxRecps = 7,
  } = opts

  return h('DarkCrystalRecipients', [
    map(state.recps, recp => Recipient({ recp, avatar })),
    RecipientInput({ state, suggest, maxRecps })
  ])
}

module.exports = Recipients
