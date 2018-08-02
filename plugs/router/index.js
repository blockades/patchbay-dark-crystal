const nest = require('depnest')

exports.gives = nest('router.sync.routes')
exports.needs = nest({
  'app.page': {
    'darkCrystalIndex': 'first',
    'darkCrystalShow': 'first'
  }
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const pages = api.app.page

    const routes = [
      [ loc => loc.page === 'dark-crystal', pages.darkCrystalIndex ],
      [ loc => loc.page === 'dark-crystal/show', pages.darkCrystalShow ]
    ]

    return [...sofar, ...routes]
  })
}
