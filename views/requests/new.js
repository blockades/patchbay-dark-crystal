const pull = require('pull-stream')
const { h } = require('mutant')

module.exports = function DarkCrystalRequestNew ({ root, scuttle, modal, state, recps }) {
  return h('div', [
    h('button -primary', { 'ev-click': (e) => state.showWarning.set(true) }, 'Request'),
    modal(
      h('Warning', [
        h('span', 'Are you sure?'),
        h('button -subtle', { 'ev-click': () => state.showWarning.set(false) }, 'Cancel'),
        h('button -subtle', { 'ev-click': () => sendRequest(recps) }, 'OK'),
      ]), {
        isOpen: state.showWarning
      }
    )
  ])
}

function sendRequest (recipients) {
  pageState.requesting.set(true)
  scuttle.recover.async.request(rootId, recipients, (err, requests) => {
    if (err) {
      errors.requests.set(err)
      pageState.requesting.set(false)
    }
    pageState.requested.set(true)
    pageState.requesting.set(false)
    state.showWarning.set(false)
  })
}
