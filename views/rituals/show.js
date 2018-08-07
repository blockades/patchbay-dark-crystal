const { h, computed } = require('mutant')
const getContent = require('ssb-msg-content')

module.exports = function DarkCrystalRitualShow (msg) {
  return computed(msg, msg => {
    if (!msg) return

    const { quorum } = getContent(msg)

    return h('section.ritual', [
      h('p', `Quorum required to reassemble: ${quorum}`)
    ])
  })
}
