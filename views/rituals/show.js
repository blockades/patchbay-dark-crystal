const pull = require('pull-stream')
const { h } = require('mutant')

module.exports = function DarkCrystalRitualShow ({ scuttle, ritual }) {
  const {
    value: {
      timestamp,
      content: {
        quorum,
        shards
      }
    }
  } = ritual

  return h('section.ritual', [
    h('p', `Quorum required to reassemble: ${quorum}`)
  ])
}
