var api  = {
  darkCrystal: {
    app: {
      page: {
        index: require('./app/page/index'),
        rituals: {
          new: require('./app/page/rituals/new'),
          index: require('./app/page/rituals/index'),
          show: require('./app/page/rituals/show')
        },
        forward: {
          new: require('./app/page/forward/new')
        }
      }
    },
    router: {
      sync: {
        routes: require('./router/sync/routes')
      }
    },
    styles: {
      mcss: require('./styles/mcss')
    }
  }
}
console.log(api)
module.exports = api
