const { h, Value, computed, when } = require('mutant')

// NOTE: Version 2.0.0 will forward _all_ shards.
// We build and publish a forward _for each_ shard message

module.exports = function DarkCrystalForwardNew ({ root, scuttle, modal }) {
  const rootId = root.key
  const forwarding = Value(false)
  const warningOpen = Value(false)

  return h('div.forward', [
    h('button', {
      'ev-click': (e) => warningOpen.set(true) 
    }, when(forwarding,
      h('i.fa.fa-spinner.fa-pulse'),
      Forward All Shards
    ))
  ])

  function warningModal () {
    const selectVisible = Value(false)
    const inputVisible = Value(false)

    return modal(
      h('div.warning', [
        h('button', {
          'ev-click': (e) => { inputVisible.set(false); selectVisible.set(true) }
        }, when(selectVisible,
          h('div.recps', [
            h('label.recps', 'Custodians'),
            Recipients({ state, suggest, avatar })
          ]),
          'Choose an existing friend'
        )),
        h('button', {
          'ev-click': (e) => { selectVisible.set(false); inputVisible.set(true) }
        })
      ])
    )
  }
}
