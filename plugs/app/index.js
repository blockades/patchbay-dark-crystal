const nest = require('depnest')
const { h, Value } = require('mutant')
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
  'keys.sync.id': 'first'
})

// TODO ?? extract a module patchbay-devtools ?
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
    const newOpen = Value(false)
    const newModal = api.app.html.modal(
      DarkCrystalNew({
        scuttle: () => {},
        suggest: {
          about: api.about.async.suggest
        },
        avatar: api.about.html.avatar,
        i18n: i => i
      }),
      { isOpen: newOpen }
    )

    return h('DarkCrystal', { title: '/dark-crystal' }, [
      newModal,
      h('h1', 'Dark Crystal'),
      h('button -primary', { 'ev-click': () => newOpen.set(true) }, 'New'),
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
