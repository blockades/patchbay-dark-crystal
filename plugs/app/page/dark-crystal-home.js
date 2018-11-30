const nest = require('depnest')
const { h, Value, computed } = require('mutant')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.darkCrystalHome': true
})

exports.needs = nest({
  'app.sync.goTo': 'first',
  'keys.sync.id': 'first',
  'sbot.obs.connection': 'first'
})

const NEW_DARK_CRYSTAL = 'Create a new Dark Crystal'
const SHOW_RITUALS = 'Return a friends shard'

const PATHWAYS = [
  { name: NEW_DARK_CRYSTAL, page: 'dark-crystal/new' },
  { name: SHOW_RITUALS, page: 'dark-crystal/index' }
]

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.darkCrystalHome': darkCrystalHomePage
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'dark-crystal' })
    }, '/dark-crystal')
  }

  function darkCrystalHomePage (location) {
    return h('DarkCrystal -home', { title: '/dark-crystal' }, [
      h('h1', 'Dark Crystal'),
      h('section.picker', PATHWAYS.map((pathway, index) => {
        const { name, page, option } = pathway
        const label = `${option} - ${name}`

        return h('div.option', { 'ev-click': () => api.app.sync.goTo({ page }) }, [
          h('div.crystal', [
            h('i.fa.fa-diamond.fa-lg')
          ]),
          h('div.inner', [
            h('div.name', name)
          ])
        ])

      })),
    ])
  }
}
