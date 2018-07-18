const { h, Struct, Value, Array: MutantArray, computed, when, map, resolve } = require('mutant')
const Recipients = require('./component/recipients')

const MIN_RECPS = 2

function DarkCrystalNew (opts) {
  const {
    scuttle,
    afterRitual = console.log,
    suggest,
    avatar,
    i18n
  } = opts

  const initialState = {
    crystalName: '',
    secret: '',
    recps: MutantArray([]),
    quorum: undefined,
    showErrors: false
  }
  const state = Struct(initialState)

  const errors = Struct({
    validation: computed(state, checkForErrors),
    ritual: Value()
  })

  return h('DarkCrystalNew', [
    h('h1', 'New Dark Crystal'),
    h('section.inputs', [
      h('div.name', [
        h('label.name', 'Name'),
        h('input.name', {
          placeholder: 'Name this crystal',
          value: state.crystalName,
          'ev-input': ev => state.crystalName.set(ev.target.value)
        })
      ]),
      h('div.secret', [
        h('label', 'Secret'),
        h('textarea', {
          placeholder: "The secret you're going to shard",
          value: state.secret,
          'ev-input': ev => state.secret.set(ev.target.value)
        })
      ]),
      h('div.recps', [
        h('label.recps', 'Custodians'),
        Recipients({ state, suggest, avatar, i18n })
      ]),
      h('div.quorum', [
        h('label.quorum', 'Quorum'),
        h('input', {
          type: 'number',
          min: MIN_RECPS,
          steps: 1,
          value: state.quorum,
          placeholder: 'min number of shards to retrieve secret',
          'ev-input': ev => state.quorum.set(Number(ev.target.value) || undefined)
        })
      ])
    ]),
    h('section.actions', [
      h('button -subtle', 'Cancel'),
      when(errors.validation,
        h('button -subtle', { 'ev-click': () => state.showErrors.set(true) }, 'Perform Ritual'),
        h('button -primary', { 'ev-click': () => performRitual(state) }, 'Perform Ritual')
      )
    ]),
    when(state.showErrors, ValidationErrors(errors)),
    when(errors.ritual, RitualErrors(errors))
  ])

  function performRitual (state) {
    const { name, secret, recps, quorum } = resolve(state)

    scuttle.async.performRitutal({ name, secret, recps, quorum }, (err, data) => {
      // NOTE - some testing errors
      // const err = 'missing name'
      err = ['missing name', 'recipients not all valid']
      // const err = null
      if (err) {
        // display the error
        state.set(initialState)
        return
      }

      // reset the state
      afterRitual(err, data)
    })

    // TODO - fill in once scuttle-dark-crystal api resolved
  }
}

function ValidationErrors (errors) {
  return computed(errors.validation, errors => {
    errors = Object.keys(errors)
      .map(k => errors[k]) // values
      .map(v => v.toString())

    return h('section.errors.-validation', [
      h('div.spacer'),
      h('div', [
        'The following need ammending before performing the ritual:',
        h('ul', map(errors, e => h('li', e)))
      ])
    ])
  })
}
function RitualErrors (errors) {
  return computed(errors.ritual, errors => {
    if (!Array.isArray(errors)) errors = [errors]

    return h('section.errors.-ritual', [
      h('div', 'Error(s) performing ritual:'),
      h('ul', errors.map(toString).map(e => h('li', e)))
    ])
  })
}

function checkForErrors ({ crystalName, secret, recps, quorum }) {
  const err = {}
  if (!crystalName) err.crystalName = 'name: required'
  if (!secret) err.secret = 'secret: required'
  if (recps.length < MIN_RECPS) err.recps = `custodians: you need to offer at least ${MIN_RECPS}`
  if (recps.length < quorum) err.quorum = 'quorum: you need more custodians, or a lower quorum.'
  if (quorum !== Math.floor(quorum)) err.quorumInt = 'quorum: must be a whole number'

  if (Object.keys(err).length) return err
  else return false
}

module.exports = DarkCrystalNew
