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
    forwardMsgs: forwards,
    recombinable,
    secretAuthor: author,
    secretCreated: createdAt
  } = crystal

  const state = {
    tab: Value(FORWARDS)
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
            h('div.forwards', [ forwards.map(DarkCrystalForwardRecord) ])
          ]
          case SECRET: return [
            when(recombinable, 
              "SECRET SUPER DUPER SECRET KEEP ME SAFE PLEEZ"
            )
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
          tab === FORWARDS ? { className: '-selected' } : { 'ev-click': () => state.tab.set(FORWARDS) },
          [ FORWARDS, h('span', `(${forwards.length})`) ]
        ),
        h('div.tab',
          tab === SECRET ? { className: '-selected' } : { 'ev-click': () => state.tab.set(SECRET) },
          [ SECRET ]
        )
      ])
    })
  }
}

function Recombine () {
  const { error, modalOpen, secret, secretLabel } = state
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
      when(secretLabel, [ h('h3', 'Label'), h('pre', secretLabel) ]),
      h('h3', 'Secret'),
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
}

function DarkCrystalForwardRecord (msg) {
  return h('div.forward', [
    h('i.DarkCrystalShard.fa.fa-diamond')
  ])
}

function identity (id) { return id }
