const nest = require('depnest')
const { h, Value, computed } = require('mutant')
const Scuttle = require('scuttle-dark-crystal')

exports.gives = nest({
  'app.page.darkCrystalForwardNew': true
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
    'app.page.darkCrystalForwardNew': darkCrystalForwardNewPage
  })

  function darkCrystalForwardNewPage (location) {
    const scuttle = Scuttle(api.sbot.obs.connection)

    return h('DarkCrystal Forward -new', { title: '/dark-crystal/forward/new' }, [
      h('header.subheader', [
        h('div.Back', [ h('i.fa.fa-arrow-left.fa-lg', { 'ev-click': goBack }) ]),
        h('h1', 'Forward shards to a new identity')
      ])
    ])

    function goBack () {
      api.app.sync.goTo({ page: 'dark-crystal' })
    }
  }
}
