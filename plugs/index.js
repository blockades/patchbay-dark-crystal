module.exports = {
  darkCrystal: {
    app: {
      page: {
        index: require('./app/page/dark-crystal-index'),
        show: require('./app/page/dark-crystal-show')
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
