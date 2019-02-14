const nest = require('depnest')
const { h, Value, computed } = require('mutant')
const Scuttle = require('scuttle-dark-crystal')

const CrystalsIndex = require('../../../views/crystals/index')
const CrystalsNew = require('../../../views/crystals/new')

const FriendsCrystalsIndex = require('../../../views/friends/crystals/index')
const FriendsCrystalsShow = require('../../../views/friends/crystals/show')

const FriendsIndex = require('../../../views/friends/index')
const FriendsShow = require('../../../views/friends/show')

const ForwardNew = require('../../../views/forward/new')
// const ForwardIndex = require('../../../views/forward/index')

const SettingsEdit = require('../../../views/settings/edit')

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

// modes
const MINE = 'My Crystals'
const OTHERS = 'Others Shards'
const FORWARDS = 'Others Crystals'

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
    const scuttle = Scuttle(api.sbot.obs.connection)
    const mode = Value(MINE)

    // mix: TODO seperate this page and the routing out

    const page = h('DarkCrystal -index', { title: '/dark-crystal' }, [
      h('h1', { title: '' }, [
        'Dark Crystal',
        h('i.fa.fa-diamond'),
        Settings({ scuttle })
      ]),
      h('section.picker', { title: '' }, [MINE, OTHERS, FORWARDS].map(m => {
        return h('div', {
          'ev-click': () => mode.set(m),
          className: computed(mode, mode => mode === m ? '-active' : '')
        }, m)
      })),
      MySecrets({ mode, scuttle }),
      OthersShards({ mode, scuttle }),
      FriendsCrystals({ mode, scuttle })
      // ForwardShards({ mode, scuttle })
    ])

    // page.scroll = () => {} // stops keyboard shortcuts from breaking
    return page
  }

  function Settings ({ scuttle }) {
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
