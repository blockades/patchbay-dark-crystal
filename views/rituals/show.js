const pull = require('pull-stream')
const { h } = require('mutant')

module.exports = function DarkCrystalRitualShow ({ scuttle, ritual }) {
  console.log(ritual)
  if (!ritual) return null

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
