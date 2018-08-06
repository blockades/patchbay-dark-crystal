const pull = require('pull-stream')
const { h } = require('mutant')

module.exports = function DarkCrystalRitualShow ({ scuttle, msg }) {
  const {
    value: {
      timestamp,
      content: {
        quorum,
        shards
      }
    }
  } = msg

  return h('section.ritual', [
    h('p', `Quorum required to reassemble: ${quorum}`)
  ])
}
