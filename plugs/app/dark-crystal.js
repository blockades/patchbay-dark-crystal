const nest = require('depnest')
const { h, Value } = require('mutant')
// const Scuttle = require('scuttle-dark-crystal')
const DarkCrystalIndex = require('../../views/index')
const DarkCrystalNew = require('../../views/new')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.darkCrystal': true
})

exports.needs = nest({
  'about.async.suggest': 'first',
  'about.html.avatar': 'first',
  'app.html.modal': 'first',
  'app.sync.goTo': 'first',
  'keys.sync.id': 'first',
  'sbot.obs.connection': 'first'
})

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

    // const scuttle = Scuttle(api.sbot.obs.connection)
    // TODO - install actual scuttle-dark-crystal
    const scuttle = {
      async: {
        performRitual: (opts, cb) => setTimeout(() => cb(null, opts), 1000)
      }
    }
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
    const modal = api.app.html.modal(form, { isOpen: formOpen })

    return h('DarkCrystal', { title: '/dark-crystal' }, [
      modal,
      h('h1', 'Dark Crystal'),
      h('button -primary', { 'ev-click': () => formOpen.set(true) }, 'New'),
      h('section', [
        DarkCrystalIndex()
      ]),
      h('section', [
        h('h2', 'queries (temp)'),
        h('a', { href: '#', 'ev-click': goToAll }, 'All'),
        ' | ',
        h('a', { href: '#', 'ev-click': goToMyRoots }, 'My roots')
      ])
    ])
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
