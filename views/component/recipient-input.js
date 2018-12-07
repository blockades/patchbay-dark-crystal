const { h } = require('mutant')
const addSuggest = require('suggest-box')

const MIN_RECPS = 0

module.exports = function RecipientInput (opts) {
  const {
    state,
    suggest,
    maxRecps
  } = opts

  const { recps } = state

  const input = h('input', {
    placeholder: 'those you trust to guard your secret'
  })

  var boxActive = false
  suggestify()

  var shouldPopRecp = false
  input.addEventListener('keyup', (e) => {
    let recpsLength = recps.getLength()
    let shouldPop = (e.code === 'Backspace' || e.key === 'Backspace' || e.keyCode === 8)

    // don't pop the previous entry if still entering a name!
    if (boxActive) {
      // if you delete a name you were typing completely, mark box inactive
      // so that further deletes pop names
      if (e.target.value === '') boxActive = false
      return
    }

    // only pop a name if the last (not this) backspace you hit set the value to empty
    // TODO: we should also disable the input field when this is the case so you can't enter
    // new characters (the only ones enterable is backspace)
    if (e.target.value !== '') shouldPopRecp = false
    else if (shouldPop && shouldPopRecp) {
      if (recpsLength < MIN_RECPS) return // can only delete down to 2 recps (sender + 1 recp)

      recps.pop()
    } else {
      shouldPopRecp = true
    }
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
