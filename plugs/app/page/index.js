const nest = require('depnest')
const { h, Value, computed } = require('mutant')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.darkCrystalIndex': true
})

exports.needs = nest({
  'app.sync.goTo': 'first',
  'keys.sync.id': 'first',
  'sbot.obs.connection': 'first'
})

const NEW_DARK_CRYSTAL = "Create a new Dark Crystal"
const SHOW_RITUALS = "View and Recover a Dark Crystal"
const RETURN_A_SHARD = "Return a friend's shard"
const FORWARD_A_SHARD = "Forward shards to a new identity"

const PATHWAYS = [
  { name: NEW_DARK_CRYSTAL, page: 'dark-crystal/new' },
  { name: SHOW_RITUALS, page: 'dark-crystal/rituals' },
  { name: RETURN_A_SHARD, page: 'dark-crystal/others-shards' },
  { name: FORWARD_A_SHARD, page: 'dark-crystal/forward/new' }
]

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
    return h('DarkCrystal -index', { title: '/dark-crystal' }, [
      h('header', [
        h('h1', 'Dark Crystal')
      ]),
      h('section.picker', PATHWAYS.map((pathway, index) => {
        const { name, page, option } = pathway
        const label = `${option} - ${name}`

        return h('div.option', { title: name, 'ev-click': () => api.app.sync.goTo({ page }) }, [
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
