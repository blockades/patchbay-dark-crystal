const nest = require('depnest')
const { h } = require('mutant')
const Scuttle = require('scuttle-dark-crystal')
const getContent = require('ssb-msg-content')

const DarkCrystalShow = require('../../../../views/crystals/show')

exports.gives = nest({
  'app.page.darkCrystalRitualsShow': true
})

exports.needs = nest({
  'about.html.avatar': 'first',
  'app.html.modal': 'first',
  'app.sync.goTo': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest({
    'app.page.darkCrystalRitualsShow': darkCrystalRitualsShowPage
  })

  function darkCrystalRitualsShowPage (location) {
    const scuttle = Scuttle(api.sbot.obs.connection)
    const { name } = getContent(location)

    const page = h('DarkCrystal Rituals -show', { title: `/dark-crystal — ${name}` }, [
      h('header.subheader', [
        h('div.Back', [ h('i.fa.fa-arrow-left.fa-lg', { 'ev-click': goBack, 'title': 'Back' }) ]),
        h('h1', name)
      ]),
      DarkCrystalShow({
        scuttle,
        root: location,
        routeTo: api.app.sync.goTo,
        avatar: api.about.html.avatar,
        modal: api.app.html.modal
      })
    ])

    return page
  }

  function goBack () {
    // mix: TODO close the current tab
    // this will be especially important if / when we make the tabs hidden in a standalone install, which I think we should
    api.app.sync.goTo({ page: 'dark-crystal/rituals' })
  }
}
