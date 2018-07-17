const { h, Struct, Value, Array: MutantArray } = require('mutant')
const Recipients = require('./component/recipients')

function DarkCrystalNew (opts) {
  const {
    scuttle,
    suggest,
    avatar,
    i18n
  } = opts

  const state = Struct({
    crystalName: Value(),
    secret: Value(),
    recps: MutantArray([])
  })
  state(console.log)

  return h('DarkCrystalNew', [
    h('h1', 'New Dark Crystal'),
    h('section.inputs', [
      h('div.name', [
        h('label.name', 'Name'),
        h('input.name', {
          placeholder: 'Choose a name for this Dark Crystal',
          value: state.crystalName,
          'ev-input': ev => state.crystalName.set(ev.target.value)
        })
      ]),
      h('div.secret', [
        h('label', 'Secret'),
        h('textarea', {
          placeholder: 'The secret you want to share.',
          value: state.secret,
          'ev-input': ev => state.secret.set(ev.target.value)
        })
      ]),
      h('div.recps', [
        h('labelrecps', 'Custodians'),
        Recipients({ state, suggest, avatar, i18n })
      ])
    ]),
    h('section.actions', [
      h('button -subtle', 'Cancel'),
      h('button -primary', 'Perform Ritual')
    ])
  ])
}

module.exports = DarkCrystalNew
