const nest = require('depnest')
const { h, Value, computed } = require('mutant')
const Scuttle = require('scuttle-dark-crystal')

const DarkCrystalNew = require('../../../views/crystals/new')

exports.gives = nest({
  'app.page.darkCrystalNew': true
})

exports.needs = nest({
  'about.async.suggest': 'first',
  'about.html.avatar': 'first',
  'app.sync.goTo': 'first',
  'keys.sync.id': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest({
    'app.page.darkCrystalNew': darkCrystalNewPage
  })

  function darkCrystalNewPage (location) {
    const scuttle = Scuttle(api.sbot.obs.connection)

    return h('DarkCrystal -new', { title: '/dark-crystal/new' }, [
      h('header', [
        h('div.arrow', [
          h('i', {
            classList: ['fa', 'fa-arrow-left', 'fa-lg'],
            'ev-click': goBack
          })
        ]),
        h('h1', 'Create a new Dark Crystal')
      ]),
      DarkCrystalNew({
        scuttle,
        onCancel: goBack,
        afterRitual: goBack,
        suggest: { about: api.about.async.suggest },
        avatar: api.about.html.avatar
      })
    ])

    function goBack () {
      api.app.sync.goTo({ page: 'dark-crystal' })
    }
  }
}
