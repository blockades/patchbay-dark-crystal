const { h, computed } = require('mutant')

module.exports = function ProgressBar (opts) {
  const {
    prepend,
    maximum,
    // middle,
    records,
    title,
    append
  } = opts

  return computed(records, (records) => {
    const value = Array.isArray(records) ? records.length : 0
    const titleText = [title, String(value), 'of', String(maximum)].filter(isString).join(' ')
    return h('ProgressBar', [
      prepend,
      h('progress', { min: 0, max: maximum, value: value, title: titleText }),
      append
    ])
  })
}

function isString (i) {
  return typeof i === 'string'
}
