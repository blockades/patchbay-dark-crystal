const nest = require('depnest')
const { h, Value, computed } = require('mutant')
const Scuttle = require('scuttle-dark-crystal')

const DarkCrystalIndex = require('../../views/index')
const DarkCrystalFriendsIndex = require('../../views/friends/index')
const DarkCrystalNew = require('../../views/new')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.darkCrystal': true
})

exports.needs = nest({
  'about.async.suggest': 'first',
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'app.html.modal': 'first',
  'app.sync.goTo': 'first',
  'keys.sync.id': 'first',
  'sbot.obs.connection': 'first'
})

// modes
const MINE = 'My Crystals'
const FRIENDS = 'Friends'

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.darkCrystal': darkCrystalPage
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'dark-crystal' })
    }, '/dark-crystal')
  }

  function darkCrystalPage (location) {
    const scuttle = Scuttle(api.sbot.obs.connection)
    const mode = Value(MINE)

    return h('DarkCrystal', { title: '/dark-crystal' }, [
      h('h1', [ 'Dark Crystal', h('i.fa.fa-diamond') ]),
      h('section.picker', [MINE, FRIENDS].map(m => {
        return h('div', {
          'ev-click': () => mode.set(m),
          className: computed(mode, mode => mode === m ? '-active' : '')
        }, m)
      })),
      Mine({ mode, scuttle }),
      Custodian({ mode, scuttle }),
      h('section.queries', [
        h('strong', 'queries:'),
        h('a', { href: '#', 'ev-click': goToAll }, 'All'),
        ' | ',
        h('a', { href: '#', 'ev-click': goToMyRoots }, 'My roots')
      ])
    ])
  }

  function Mine ({ mode, scuttle }) {
    const { formModal, formOpen } = Form(scuttle)
    return h('section.content', { className: computed(mode, m => m === MINE ? '-active' : '') }, [
      formModal,
      h('button -primary', { 'ev-click': () => formOpen.set(true) }, 'New'),
      DarkCrystalIndex({ scuttle })
    ])
  }

  function Custodian ({ mode, scuttle }) {
    return h('section.content', { className: computed(mode, m => m === FRIENDS ? '-active' : '') }, [
      DarkCrystalFriendsIndex({ 
        scuttle,
        avatar: api.about.html.avatar,
        name: api.about.obs.name 
      })
    ])
  }

  function Form (scuttle) {
    const form = DarkCrystalNew({
      scuttle,
      onCancel: () => formOpen.set(false),
      afterRitual: (err, data) => {
        if (err) return
        formOpen.set(false)
        console.log('ritual complete', data)
      },
      suggest: { about: api.about.async.suggest },
      avatar: api.about.html.avatar
    })
    const formOpen = Value(false)
    const formModal = api.app.html.modal(form, { isOpen: formOpen })

    return { formModal, formOpen }
  }

  function goToAll (ev) {
    ev.preventDefault()

    const initialQuery = [{
      $filter: {
        value: {
          timestamp: { $gt: 0 }, // needed for how I set up /query page
          content: {
            type: { $prefix: 'dark-crystal' }
          }
        }
      }
    }]
    return api.app.sync.goTo({ page: 'query', initialQuery })
  }

  function goToMyRoots (ev) {
    ev.preventDefault()

    const initialQuery = [{
      $filter: {
        value: {
          author: api.keys.sync.id(),
          timestamp: { $gt: 0 }, // needed for how I set up /query page
          content: { type: 'dark-crystal/root' }
        }
      }
    }]
    return api.app.sync.goTo({ page: 'query', initialQuery })
  }
}
