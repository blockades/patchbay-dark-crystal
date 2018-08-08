const pull = require('pull-stream')
const { h } = require('mutant')

const Timestamp = require('../component/timestamp')

module.exports = function DarkCrystalRequestShow ({ root, scuttle, msg }) {
  if (!msg) throw new Error('missing request')

  const {
    value: {
      timestamp,
      content: {
        body
      }
    }
  } = msg

  return h('div.request', [
    Timestamp({
      prefix: 'Requested on',
      timestamp: timestamp
    })
  ])
}
