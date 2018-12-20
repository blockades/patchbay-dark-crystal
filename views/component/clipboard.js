module.exports = function Clipboard (opts) {
  const { toCopy = Value() } = opts
  const btnVisible = Value(true)

  return h('div.copy', [
    h('button -primary', { 'ev-click': copy }, [
      h('i.fa.fa-copy'),
      'Copy to clipboard'
    ]),
    h('button', `(ﾉ´ヮ´)ﾉ*:･ﾟ✧`)
  ])

  function copy () {
    btnVisible.set(false)
    clipboard.writeText(resolve(toCopy))

    setTimeout(() => btnVisible.set(true), 500)
  }
}
