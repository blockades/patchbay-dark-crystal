const { h, when, computed, Value, resolve } = require('mutant')
const { clipboard } = require('electron')

module.exports = {
  performRecombine: function performRecombine (rootId, scuttle, { recombining, error, secret, modalOpen }) {
    recombining.set(true)

    scuttle.recover.async.recombine(rootId, (err, s) => {
      if (err) error.set(err)
      else secret.set(s.secret)
      // TODO: handle labels (mix is on this one i think)
      recombining.set(false)
      modalOpen.set(true)
    })
  },

  RecombineModal: function RecombineModal (modal, state) {
    const { error, modalOpen, secret } = state
    const copyBtnVisible = Value(true)
    const copySecret = () => {
      copyBtnVisible.set(false)
      clipboard.writeText(resolve(secret))

      setTimeout(() => copyBtnVisible.set(true), 500)
    }

    // TODO - extract? (and extract styles)
    const content = h('DarkCrystalSecret', when(error,
      [
        h('h1', [
          'Error combining shards!!!'
        ]),
        h('pre', computed(error, e => (e || '').toString())),
        h('div.actions', [
          h('button -subtle', { 'ev-click': () => modalOpen.set(false) }, 'close')
        ])
      ],
      [
        h('h1', 'Your secret'),
        h('pre', secret),
        h('div.actions', [
          when(copyBtnVisible,
            h('button -primary', { 'ev-click': copySecret }, [
              h('i.fa.fa-copy'),
              'Copy to clipboard'
            ]),
            h('button', `(ﾉ´ヮ´)ﾉ*:･ﾟ✧`)
          ),
          h('button -subtle', { 'ev-click': () => modalOpen.set(false) }, 'close')
        ])
      ])
    )

    return modal(content, { isOpen: modalOpen })
  }
}
