const nest = require('depnest')
const { h, Value, Struct } = require('mutant')
const pull = require('pull-stream')
const Scuttle = require('scuttle-dark-crystal')
const getContent = require('ssb-msg-content')

const DarkCrystalShow = require('../../views/show')

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
    const root = location.root
    const { name } = getContent(root)

    return h('DarkCrystal', { title: `dark-crystal/${name}` }, [
      h('button -subtle', { 'ev-click': () => api.app.sync.goTo({ page: 'dark-crystal' }) }, 'Back'),
      DarkCrystalShow({
        scuttle,
        root,
        routeTo: api.app.sync.goTo,
        avatar: api.about.html.avatar,
        modal: api.app.html.modal
      })
    ])
  }
}
