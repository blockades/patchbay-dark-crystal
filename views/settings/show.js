const { h, resolve, Value, computed, when } = require('mutant')

const LocalPeers = require('./network/localPeers')
const AccountEdit = require('./account/edit')

const NETWORK = 'network'
const ACCOUNT = 'account'

module.exports = function SettingsShow (opts) {
  const {
    feedId,
    onCancel = console.log,
    avatar = identity,
    name = identity,
    publish,
    blobUrl,
    addBlob,
    localPeers
  } = opts

  const state = {
    tab: Value(ACCOUNT)
  }

  return h('Settings', [
    h('h1', 'Settings'),
    h('section.body', [
      Tabs(state),
      computed(state.tab, tab => {
        switch (tab) {
          case ACCOUNT: return [
            AccountEdit({
              name,
              avatar,
              addBlob,
              publish,
              feedId,
              blobUrl,
              onCancel
            })
          ]
          case NETWORK: return [
            LocalPeers({
              name,
              avatar,
              localPeers
            })
          ]
        }
      }),
    ])
  ])
}

function Tabs (state) {
  return computed(state.tab, tab => {
    return h('div.tabs', [
      h('div.tab',
        tab === ACCOUNT ? { className: '-selected' } : { 'ev-click': () => state.tab.set(ACCOUNT) },
        [ ACCOUNT ]
      ),
      h('div.tab',
        tab === NETWORK ? { className: '-selected' } : { 'ev-click': () => state.tab.set(NETWORK) },
        [ NETWORK ]
      )
    ])
  })
}


function identity (id) { return id }
