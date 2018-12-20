const { h, Value, when, computed, Array: MutantArray, resolve } = require('mutant')
const pull = require('pull-stream')

const Recipient = require('../component/recipient')
const Timestamp = require('../component/timestamp')

const FORWARDS = 'FORWARDS'
const SECRET = 'SECRET'

module.exports = function DarkCrystalForwardsCollection (opts) {
  const {
    crystal,
    scuttle,
    avatar = identity,
    name = identity,
    onCancel = console.log
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
    showSecret: Value(false)
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
            h('div.secret', [ Secret(state) ])
          ]
        }
      }),
      h('div.actions', [
        h('button -subtle', { 'ev-click': onCancel }, 'Cancel')
      ])
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
          tab === SECRET ? { className: '-selected' } : { 'ev-click': () => { state.showSecret.set(true); state.tab.set(SECRET) } },
          [ SECRET ]
        )
      ])
    })
  }

  function Secret (state) {
    return when(state.showSecret,
      h('button -primary', { 'ev-click': (e) => { console.log("RECOMBINING AND THEN WILL DISPLAY SECRET") } })
    )
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
