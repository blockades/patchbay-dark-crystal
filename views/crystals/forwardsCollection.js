const { h, Value, when, computed, Array: MutantArray, resolve } = require('mutant')
const pull = require('pull-stream')

const Recipient = require('../component/recipient')
const Timestamp = require('../component/timestamp')
const Secret = require('../component/secret')

const FORWARDS = 'FORWARDS'
const SECRET = 'SECRET'

module.exports = function DarkCrystalForwardsCollection (opts) {
  const {
    crystal,
    scuttle,
    avatar = identity,
    name = identity,
    onCancel = console.log,
  } = opts

  console.log(crystal)

  const {
    forwards,
    recombinable,
    secretAuthor: author,
    secretCreated: createdAt
  } = crystal

  const state = {
    tab: Value(FORWARDS),
    recombining: Value(false),
    showSecret: Value(false),
    secret: Value(),
    secretLabel: Value(),
    error: Value()
  }

  return h('DarkCrystalForwardsCollection', [
    h('section.left'),
    h('section.body', [
      Recipient({ recp: author, avatar, name }),
      Timestamp({ timestamp: createdAt }),
      Tabs(state),
      computed(state.tab, tab => {
        switch (tab) {
          case FORWARDS: return [
            h('div.forwards', [ forwards.map(Forward) ])
          ]
          case SECRET: return [
            h('div.secret', [ viewSecret(state) ])
          ]
        }
      }),
      h('div.actions', [ h('button -subtle', { 'ev-click': onCancel }, 'Cancel') ])
    ]),
    h('section.right')
  ])

  function Tabs (state) {
    return computed(state.tab, tab => {
      return h('div.tabs', [
        h('div.tab',
          tab === FORWARDS ? { className: '-selected' } : { 'ev-click': () => { state.showSecret.set(false); state.tab.set(FORWARDS) } },
          [ FORWARDS, h('span', `(${forwards.length})`) ]
        ),
        h('div.tab',
          tab === SECRET ? { className: '-selected' } : { 'ev-click': () => { state.tab.set(SECRET) } },
          [ SECRET ]
        )
      ])
    })
  }

  function viewSecret (state) {
    return computed(state.showSecret, showSecret => {
      if (!showSecret) return [
        h('button -primary', { 'ev-click': (e) => { scuttle.recover.async.recombine(recombinable, (err, secret) => {
          state.secret.set(secret.secret)
          state.secretLabel.set(secret.label)
          state.showSecret.set(true)
        }) } }, 'Show')
      ]
      else return [
        h('button -primary', { 'ev-click': (e) => { console.log("HIDING SECRET"); state.showSecret.set(false) } }, 'Hide'),
        h('div.section', [
          computed([state.secret, state.secretLabel, state.error], (secret, secretLabel, error) => {
            console.log(secret, secretLabel, error)
            return Secret({ secret, secretLabel, error })
          })
        ])
      ]
    })
  }

  function Forward (forward) {
    console.log(forward)
    return h('div.forward', [
      h('div.author', avatar(forward.author)),
      h('div.name', name(forward.author)),
      h('div.sent', new Date(forward.timestamp).toLocaleDateString())
    ])
  }
}

function identity (id) { return id }
