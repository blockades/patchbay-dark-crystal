const nest = require('depnest')
const { h, Value } = require('mutant')
const pull = require('pull-stream')
const Scuttle = require('scuttle-dark-crystal')

const DarkCrystalIndex = require('../../../views/index')
const DarkCrystalNew = require('../../../views/new')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.darkCrystalIndex': true
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

    const { formModal, formOpen } = Form(scuttle)

    return h('DarkCrystal', { title: '/dark-crystal' }, [
      formModal,
      h('h1', [ 'Dark Crystal', h('i.fa.fa-diamond') ]),
      h('button -primary', { 'ev-click': () => formOpen.set(true) }, 'New'),
      h('section.index', [
        DarkCrystalIndex({ scuttle, routeTo: api.app.sync.goTo })
      ]),
      h('section.queries', [
        h('strong', 'queries:'),
        h('a', { href: '#', 'ev-click': goToAll }, 'All'),
        ' | ',
        h('a', { href: '#', 'ev-click': goToMyRoots }, 'My roots')
      ])
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

  function fakeScuttle () {
    return {
      async: {
        performRitual: (opts, cb) => setTimeout(() => cb(null, opts), 1000)
      },
      pull: {
        roots: () => pull.values([
          { key: 'bobo', value: {timestamp: new Date(2018, 6, 4), content: { name: 'My first wallet backup' }} },
          { key: 'bobo', value: {timestamp: new Date(), content: { name: 'Protozoa wallet' }} }
        ]),
        backlinks: () => pull.values([
          { key: 'bobo', value: {content: { shard: 'abc-123' }} },
          { key: 'bobo', value: {content: { shard: 'doop-boop' }} }
        ])
      }
    }
  }
}
