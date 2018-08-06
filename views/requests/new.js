const pull = require('pull-stream')
const { h, Value } = require('mutant')

module.exports = function DarkCrystalRequestNew ({ root, scuttle, modal, state, recps }) {
  const warning = Value(false)

  return h('div.request', [
    h('button -primary', { 'ev-click': (e) => warning.set(true) }, 'Request'),
    warningModal()
  ])

  function warningModal () {
    return modal(
      h('div.warning', [
        h('span', 'Are you sure?'),
        h('button -subtle', { 'ev-click': () => warning.set(false) }, 'Cancel'),
        h('button -subtle', { 'ev-click': () => sendRequest(recps) }, 'OK'),
      ]), { isOpen: warning }
    )
  }

  function sendRequest () {
    state.requesting.set(true)
    scuttle.recover.async.request(rootId, recipients, (err, requests) => {
      if (err) {
        state.requesting.set(false)
        // render an error
      } else {
        state.requested.set(true)
        state.requesting.set(false)
        warning.set(false)
      }
    })
  }
}
