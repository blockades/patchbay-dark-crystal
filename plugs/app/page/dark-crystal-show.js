const nest = require('depnest')
const { h } = require('mutant')
const Scuttle = require('scuttle-dark-crystal')
const getContent = require('ssb-msg-content')

const DarkCrystalShow = require('../../../views/show')

exports.gives = nest({
  'app.page.darkCrystalShow': true
})

exports.needs = nest({
  'about.html.avatar': 'first',
  'app.html.modal': 'first',
  'app.sync.goTo': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest({
    'app.page.darkCrystalShow': darkCrystalShowPage
  })

  function darkCrystalShowPage (location) {
    const scuttle = Scuttle(api.sbot.obs.connection)
    const { name } = getContent(location)

    return h('DarkCrystal -show', { title: `dark-crystal — ${name}` }, [
      h('h1', [ 'Dark Crystal', h('i.fa.fa-diamond') ]),
      h('section.header', [
        h('div.Back', [
          h('i.fa.fa-arrow-left.fa-lg', {
            'ev-click': () => api.app.sync.goTo({ page: 'dark-crystal' }),
            'title': 'Back'
          })
        ]),
        h('div.Header', [
          h('h2', name)
        ])
      ]),
      DarkCrystalShow({
        scuttle,
        root: location,
        routeTo: api.app.sync.goTo,
        avatar: api.about.html.avatar,
        modal: api.app.html.modal
      })
    ])
  }
}
