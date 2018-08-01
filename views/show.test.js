// run this with electro:
// npx electro views/index.test.js

const pull = require('pull-stream')
const Scuttle = require('scuttle-dark-crystal')

const Server = require('./lib/testbot')
const attachStyles = require('./lib/attachStyles')
const viewName = 'show'
const View = require(`./${viewName}`)

const server = Server()


const rootContent = {type: 'dark-crystal/root', version: '1.0.0', name: 'MMT longterm wallet'}
server.private.publish(rootContent, [server.id], (err, root) => {
  console.log(err, root)
  root.value.content = rootContent // skipping unboxing!

  const opts = {
    root,
    scuttle: Scuttle(server)
  }
  document.body.appendChild(View(opts))

  setTimeout(() => addShards(root.key, (err, shards) => {
    setTimeout(() => addRequests(root.key, shards), 1600)
  }, 800))
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

function addRequests(root, shards, cb = console.log) {
  pull(
    pull.values(shards),
    pull.map(shard => {
      const { root, recps = [] } = getContent(shard)
      return {
        type: 'invite',
        version: '1',
        recps: recps,
        root: root,
        body: 'gimme gimme gimme'
      }
    }),
    pull.asyncMap((content, cb) => server.private.publish(content, content.recps, cb)),
    pull.collect((err, data) => {
      if (err) cb(err)
      else cb(null, data)
    })
  )
}
