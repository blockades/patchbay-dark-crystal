const pull = require('pull-stream')
const { h } = require('mutant')

module.exports = function Timestamp ({ prefix, timestamp, suffix }) {
  if (!timestamp) throw new Error('missing timestamp')

  const time = new Date(timestamp).toLocaleDateString()
  let text = [prefix, time, suffix]
    .filter(isString)
    .join(' ')

  return h('div.Timestamp', text)
}

function isString (i) {
  return typeof i === 'string'
}
