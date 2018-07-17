const nest = require('depnest')

exports.gives = nest('router.sync.routes')
exports.needs = nest({
  'app.page': {
    'darkCrystal': 'first'
  }
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const pages = api.app.page

    const routes = [
      [ loc => loc.page === 'dark-crystal', pages.darkCrystal ]
    ]
    // TODO - consider if we want all actions inside this one page (like chess) or to break out into multiple

    return [...sofar, ...routes]
  })
}
