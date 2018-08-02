// run this with electro:
// npx electro views/index.test.js

const pull = require('pull-stream')
const Scuttle = require('scuttle-dark-crystal')

const Server = require('./lib/testbot')
const attachStyles = require('./lib/attachStyles')
const viewName = 'show'
const View = require(`./${viewName}`)
const getContent = require('ssb-msg-content')

const server = Server()
const scuttle = Scuttle(server)

let params = {
  name: 'MMT longterm wallet',
  secret: 'test',
  recps: [server.createFeed().id, server.createFeed().id],
  quorum: 2
}

setTimeout(() => scuttle.share.async.share(params, (err, data) => {
  const { root, ritual, shards } = data

  console.log("PRE-POPULATED DATABASE")

  document.body.appendChild(View({
    scuttle,
    root,
    avatar: () => {},
    modal: () => {},
  }))

  console.log("VIEW APPENDED")

  setTimeout(() => {
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
      pull.asyncMap((shard, callback) => {
        scuttle.recover.async.request(root.key, shard.recps, (err, request) => {
          callback(null, server.private.unbox(request))
        })
      }),
      pull.drain(request => {
        console.log(request)
      })
    )

  }, 800)
}), 800)

attachStyles([
  `${viewName}.mcss`
])
