// run this with electro:
// npx electro views/index.test.js

const pull = require('pull-stream')

const Server = require('./lib/testbot')
const attachStyles = require('./lib/attachStyles')
const viewName = 'index'
const View = require(`./${viewName}`)

const server = Server()

// publish some dark-crystal/roots !
const names = [ 'dark crystal core', 'MMT longterm wallet', 'Protozoa etherwallet' ]

// TODO replace with some scuttle-dark-crystal methods
pull(
  pull.values(names),
  pull.map(name => {
    return {type: 'dark-crystal/root', version: '1.0.0', name, recps: [server.id]}
  }),
  pull.asyncMap((content, cb) => server.private.publish(content, content.recps, cb)),
  pull.collect((err, data) => {
    console.log(err, data)
  })
)

const opts = {
  scuttle: Scuttle(server),
}

document.body.appendChild(View(opts))

attachStyles([
  `${viewName}.mcss`
])


// TODO replace with scuttle-dark-crystal
function Scuttle (server) {
  return {
    pull: {
      roots: buildPullRoots(server)
    }
  }
}

// TODO extract into scuttle-dark-crystal
function buildPullRoots (server) {
  return function pullRoots (opts = {}) {
    const query = [{
      $filter: {
        value: {
          content: { type: 'dark-crystal/root' }
        }
      }
    }]
    return pull(
      server.query.read(Object.assign({}, opts, { query }))
      // pull.filter(isRoot)
    )
  }
}

