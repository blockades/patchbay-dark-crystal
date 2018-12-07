const { h } = require('mutant')
const addSuggest = require('suggest-box')

const MIN_RECPS = 0

module.exports = function RecipientInput (opts) {
  const {
    state,
    suggest,
    maxRecps,
    placeholder = '',
    onChange
  } = opts

  const { recps } = state

  const input = h('input', { placeholder })

  var boxActive = false
  suggestify()

  var targetEmpty = false
  input.addEventListener('keyup', (e) => {
    let targetIsntEmpty = e.target.value.length !== 0
    let recpsLength = recps.getLength()
    let isBackspace = (e.code === 'Backspace' || e.key === 'Backspace' || e.keyCode === 8)

    if (boxActive) {
      if (targetIsntEmpty) boxActive = false
      return
    }

    if (targetIsntEmpty) {
      targetEmpty = false
      return
    }

    if (isBackspace && targetEmpty) {
      if (recpsLength < MIN_RECPS) return
      recps.pop()
      onChange()
    }

    targetEmpty = true
  })

  return input

  function suggestify () {
    if (!input.parentElement) return setTimeout(suggestify, 100)

    addSuggest(input, (inputText, cb) => {
      if (recps.getLength() >= maxRecps) return
      // TODO - tell the user they're only allowed 6 (or 7?!) people in a message

      boxActive = true
      const searchTerm = inputText.replace(/^@/, '')
      suggest.about(searchTerm, cb)
    }, {cls: 'PatchSuggest'})

    input.addEventListener('suggestselect', (e) => {
      const { id, title: name } = e.detail
      if (!recps.find(r => r === id || r.link === id)) {
        recps.push({ link: id, name })
      }

      boxActive = false
      e.target.value = ''
      e.target.placeholder = ''
    })
  }
}
