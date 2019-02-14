const nest = require('depnest')
const pull = require('pull-stream')
const Scuttle = require('scuttle-dark-crystal')

const {
  h,
  Value,
  computed,
  when,
  onceTrue,
  Array: MutantArray,
  Struct,
} = require('mutant')

// Views
const CrystalsIndex = require('../../../views/crystals/index')
const CrystalsNew = require('../../../views/crystals/new')
const FriendsCrystalsIndex = require('../../../views/friends/crystals/index')
const FriendsCrystalsShow = require('../../../views/friends/crystals/show')
const FriendsIndex = require('../../../views/friends/index')
const FriendsShow = require('../../../views/friends/show')
const ForwardNew = require('../../../views/forward/new')
const SettingsEdit = require('../../../views/settings/edit')

// Components
const Tooltip = require('../../../views/component/tooltip')

// Modes / Tabs
const MINE = 'My Crystals'
const OTHERS = 'Others Shards'
const FORWARDS = 'Others Crystals'

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.darkCrystalIndex': true
})

exports.needs = nest({
  'about.async.suggest': 'first',
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'app.html.modal': 'first',
  'app.sync.goTo': 'first',
  'keys.sync.id': 'first',
  'sbot.obs.connection': 'first',
  'blob.sync.url': 'first',
  'message.async.publish': 'first',
  'sbot.async.addBlob': 'first'
})


exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.darkCrystalIndex': darkCrystalIndexPage
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'dark-crystal' })
    }, '/dark-crystal')
  }

  function darkCrystalIndexPage (location) {
    const server = api.sbot.obs.connection
    const scuttle = Scuttle(server)

    const state = Struct({
      ready: Value(false),
      mode: Value(MINE),
      abouts: MutantArray([])
    })

    onceTrue(server, server => {
      updateStore()
      watchForUpdates()

      function aboutsQuery () {
        return {
          query: [{
            $filter: {
              value: {
                author: server.id,
                timestamp: { $gt: 0 },
                content: {
                  type: 'about',
                  about: server.id
                }
              }
            }
          }]
        }
      }

      function updateStore () {
        pull(
          server.query.read(Object.assign({}, aboutsQuery(), { live: false })),
          pull.collect(
            (err, abouts) => {
              if (err) throw err
              else {
                state.abouts.set(abouts)
                state.ready.set(true)
              }
            }
          )
        )
      }

      function watchForUpdates () {
        pull(
          server.query.read(Object.assign({}, aboutsQuery(), { old: false, live: true })),
          pull.filter(m => !m.sync),
          pull.drain(m => updateStore())
        )
      }
    })

    return when(state.ready,
      h('DarkCrystal -index', { title: '/dark-crystal' }, [
        h('h1', [
          'Dark Crystal',
          h('i.fa.fa-diamond'),
          Settings({ abouts: state.abouts, scuttle })
        ]),
        h('section.picker', [MINE, OTHERS, FORWARDS].map(m => {
          return h('div', {
            'ev-click': () => state.mode.set(m),
            className: computed(state.mode, mode => mode === m ? '-active' : '')
          }, m)
        })),
        MySecrets({ mode: state.mode, scuttle }),
        OthersShards({ mode: state.mode, scuttle }),
        FriendsCrystals({ mode: state.mode, scuttle })
      ]),
      h('i.fa.fa-spinner.fa-pulse')
    )
  }

  function Settings ({ scuttle, abouts }) {
    const isOpen = Value(false)

    const view = SettingsEdit({
      onCancel: () => isOpen.set(false),
      feedId: api.keys.sync.id(),
      avatar: api.about.html.avatar,
      name: api.about.obs.name,
      publish: api.message.async.publish,
      blobUrl: api.blob.sync.url,
      addBlob: api.sbot.async.addBlob
    })

    const modal = api.app.html.modal(view, { isOpen })

    return [
      h('i.fa.fa-cog', { 'ev-click': () => isOpen.set(true), title: 'Settings' }),
      // TODO: integrate a tooltip or flash alert system to begin to show warning messages to users...
      abouts.getLength() > 0 ? null : h('i.fa.fa-warning'), // currently shows when is first time user (i.e. they haven't published a name or avatar)
      // abouts.getLength() > 0 ? null : Tooltip({
      //   text: 'Setup your account details in the settings page...',
      //   position: 'top'
      // }),
      modal
    ]
  }

  function MySecrets ({ mode, scuttle }) {
    const { formModal, formOpen } = NewCrystalForm(scuttle)

    return h('section.content', { className: computed(mode, m => m === MINE ? '-active' : '') }, [
      formModal,
      h('button -primary', { 'ev-click': () => formOpen.set(true) }, 'New'),
      h('CrystalsIndex', [
        CrystalsIndex({
          scuttle,
          routeTo: api.app.sync.goTo
        })
      ])
    ])
  }

  function OthersShards ({ mode, scuttle }) {
    const view = Value('Dogs are cool')
    const isOpen = Value(false)
    const modal = api.app.html.modal(view, { isOpen })

    function showFriend (opts) {
      view.set(FriendsShow(Object.assign({}, opts, {
        avatar: api.about.html.avatar,
        name: api.about.obs.name,
        scuttle,
        newForward,
        onCancel: () => isOpen.set(false)
      })))
      isOpen.set(true)
    }

    function newForward (opts) {
      view.set(ForwardNew(Object.assign({}, opts, {
        avatar: api.about.html.avatar,
        name: api.about.obs.name,
        suggest: { about: api.about.async.suggest },
        scuttle,
        onCancel: () => isOpen.set(false)
      })))
      isOpen.set(true)
    }

    return h('section.content', { className: computed(mode, m => m === OTHERS ? '-active' : '') }, [
      FriendsIndex({
        scuttle,
        avatar: api.about.html.avatar,
        name: api.about.obs.name,
        showFriend
      }),
      modal
    ])
  }

  function FriendsCrystals ({ mode, scuttle }) {
    const view = Value('Cats always make a comeback!')
    const isOpen = Value(false)
    const modal = api.app.html.modal(view, { isOpen })

    function friendsCrystal (opts) {
      view.set(FriendsCrystalsShow(Object.assign({}, opts, {
        scuttle,
        avatar: api.about.html.avatar,
        name: api.about.obs.name,
        onCancel: () => isOpen.set(false)
      })))
      isOpen.set(true)
    }

    return h('section.content', { className: computed(mode, m => m === FORWARDS ? '-active' : '') }, [
      FriendsCrystalsIndex({
        scuttle,
        avatar: api.about.html.avatar,
        name: api.about.obs.name,
        modal: api.app.html.modal,
        friendsCrystal
      }),
      modal
    ])
  }

  // function ForwardShards ({ mode, scuttle }) {
  //   const view = Value('Cats are cooler')
  //   const isOpen = Value(false)
  //   const forwardModal = api.app.html.modal(view, { isOpen })

  //   const newForward = (opts) => {
  //     view.set(ForwardNew(Object.assign({}, opts, {
  //       avatar: api.about.html.avatar,
  //       name: api.about.obs.name,
  //       suggest: { about: api.about.async.suggest },
  //       scuttle,
  //       onCancel: () => isOpen.set(false)
  //     })))
  //     isOpen.set(true)
  //   }

  //   return h('section.content', { className: computed(mode, m => m === FORWARD ? '-active' : '') }, [
  //     h('div.message', [ h('div.span',  'Select a friend whose shards you have been asked to forward...') ]),
  //     ForwardIndex({
  //       scuttle,
  //       avatar: api.about.html.avatar,
  //       name: api.about.obs.name,
  //       newForward
  //     }),
  //     forwardModal
  //   ])
  // }

  function NewCrystalForm (scuttle) {
    const form = CrystalsNew({
      scuttle,
      onCancel: () => formOpen.set(false),
      afterRitual: (err, data) => {
        if (err) return
        formOpen.set(false)
        console.log('ritual complete', data)
      },
      suggest: { about: api.about.async.suggest },
      name: api.about.obs.name,
      avatar: api.about.html.avatar
    })
    const formOpen = Value(false)
    const formModal = api.app.html.modal(form, { isOpen: formOpen })

    return { formModal, formOpen }
  }

}
