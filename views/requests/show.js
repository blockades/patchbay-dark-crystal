const pull = require('pull-stream')
const { h } = require('mutant')

const Timestamp = require('../component/timestamp')

module.exports = function DarkCrystalRequestShow ({ root, scuttle, request }) {
  if (!request) throw new Error('missing request')

  const {
    value: {
      timestamp,
      content: {
        body
      }
    }
  } = request

  return h('div.request', [
    Timestamp({
      prefix: 'Requested on',
      timestamp: timestamp
    })
  ])
}
