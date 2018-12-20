const { h, Value, when, computed } = require('mutant')

const Recipient = require('../component/recipient')
const Timestamp = require('../component/timestamp')
const Secret = require('../component/secret')

const FORWARDS = 'FORWARDS'
const SECRET = 'SECRET'

module.exports = function DarkCrystalForwardsCollection (opts) {
  const {
    scuttle,
    avatar = identity,
    name = identity,
    onCancel = console.log,
    crystal: {
      forwards,
      root,
      recombinable,
      secretAuthor: author,
      secretCreated: createdAt
    }
  } = opts

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
          case FORWARDS: return ForwardTab()
          case SECRET: return SecretTab()
        }
      }),
      h('div.actions', [ h('button -subtle', { 'ev-click': onCancel }, 'Cancel') ])
    ]),
    h('section.right')
  ])

  function SecretTab () {
    return [
      h('div.secret', [
        when(state.showSecret,
          [
            h('button -primary', { 'ev-click': (e) => state.showSecret.set(false) }, 'Hide'),
            h('div.section', [
              computed([state.secret, state.secretLabel, state.error], (secret, secretLabel, error) => Secret({ secret, secretLabel, error }))
            ])
          ],
          [
            h('button -primary', {
              'ev-click': (e) => {
                scuttle.recover.async.recombine(root, (err, secret) => {
                  if (err) return state.error.set(err)
                  state.secret.set(secret.secret)
                  state.secretLabel.set(secret.label)
                  state.showSecret.set(true)
                })
              }
            }, 'Show')
          ]
        )
      ])
    ]
  }

  function ForwardTab () {
    return [ h('div.forwards', [ forwards.map(Forward) ]) ]
  }

  function Forward (forward) {
    const { author, timestamp } = forward

    return h('div.forward', [
      h('div.author', avatar(author)),
      h('div.name', name(author)),
      Timestamp({ timestamp })
    ])
  }

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
}

function identity (id) { return id }
