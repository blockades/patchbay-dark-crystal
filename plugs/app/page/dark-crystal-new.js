const nest = require('depnest')
const { h, Value, computed } = require('mutant')
const Scuttle = require('scuttle-dark-crystal')

const DarkCrystalNew = require('../../../views/new')

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

    return DarkCrystalNew({
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
  }
}
