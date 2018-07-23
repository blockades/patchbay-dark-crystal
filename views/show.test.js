// run this with electro:
// npx electro views/index.test.js

const pull = require('pull-stream')

const Server = require('./lib/testbot')
const attachStyles = require('./lib/attachStyles')
const viewName = 'show'
const View = require(`./${viewName}`)

const server = Server()


// TODO replace with some scuttle-dark-crystal methods
const rootContent = {type: 'dark-crystal/root', version: '1.0.0', name: 'MMT longterm wallet'}
server.private.publish(rootContent, [server.id], (err, root) => {
  console.log(err, root)
  root.value.content = rootContent // skipping unboxing!

  const opts = {
    root,
    scuttle: Scuttle(server)
  }
  document.body.appendChild(View(opts))

  setTimeout(() => addShards(root.key), 800)
})

attachStyles([
  `${viewName}.mcss`
])

function addShards (root, cb = console.log) {
  const shards = ['abc-124', 'doop-doop', 'swag-dag']
  pull(
    pull.values(shards),
    pull.map(shard => {
      return {
        type: 'dark-crystal/shard', version: '1.0.0', root, shard, recps: [server.id, server.createFeed().id]
      }
    }),
    pull.asyncMap((content, cb) => {
      server.private.publish(content, content.recps, cb)
    }),
    pull.collect((err, data) => {
      if (err) return cb(err)

      cb(null, data)
    })
  )
}

// TODO replace with scuttle-dark-crystal
function Scuttle (server) {
  return {
    pull: {
      backlinks: buildPullBacklinks(server)
    }
  }
}

// TODO extract into scuttle-dark-crystal
function buildPullBacklinks (server) {
  return function pullBacklinks (key, opts = {}) {
    const query = [{
      $filter: { dest: key }
      // index: 'DTA' // don't think this is needed?
    }]
    return pull(
      server.backlinks.read(Object.assign({}, opts, { query }))
      // pull.filter(m => isShard(m) || isRitual(m))
    )
  }
}

