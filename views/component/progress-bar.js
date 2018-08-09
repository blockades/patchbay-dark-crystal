const { h } = require('mutant')

module.exports = function ProgressBar (opts) {
  const {
    prepend,
    maximum,
    // middle,
    records,
    title,
    append
  } = opts

  const value = Array.isArray(records) ? records.length : 0
  const titleText = `${title}: ${value} / ${maximum}`
  return h('ProgressBar', [
    prepend,
    h('progress', { min: 0, max: maximum, value: value, title: titleText }),
    append
  ])
}
