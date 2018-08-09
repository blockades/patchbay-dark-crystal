const pull = require('pull-stream')
pull.paramap = require('pull-paramap')
const { h, Array: MutantArray, computed } = require('mutant')
const getContent = require('ssb-msg-content')
const isRequest = require('scuttle-dark-crystal/isRequest')
const isReply = require('scuttle-dark-crystal/isReply')
const sort = require('ssb-sort')

// const DarkCrystalShowShard = require('./show')

const RECEIVED = 'received'
const REQUESTED = 'requested'
const REPLIED = 'replied'

function DarkCrystalFriendsIndex (opts) {
  const {
    avatar = identity,
    name = identity,
    scuttle
  } = opts

  const store = {
    records: MutantArray([])
  }
  getRecords()
  watchForUpdates()

  return h('DarkCrystalFriendsIndex', [
    computed(store.records, records => {
      return records.map(Record)
    })
  ])

  function Record ({ shard, requests, replies }) {
    const { author, timestamp } = shard.value

    var state = RECEIVED
    if (requests.length) state = REQUESTED
    if (replies.length) state = REPLIED

    // NOTE - it's possible to have replied without having received a request
    // I think being able to return a shard because you're about to lose your computer is important
    // At the moment this is hard to do because scuttle assumes an invite to be replying to ):

    const returnShard = () => {
      scuttle.recover.async.reply(requests[0], (err, data) => {
        if (err) throw err

        console.log('shard returned', data)
        getRecords() // refresh the view
      })
    }

    switch (state) {
      case RECEIVED:
        return h('div.shard -received', [
          h('div.avatar', avatar(author)),
          h('div.name', name(author)),
          // h('button', { 'ev-click': returnShard }, 'Return Shard'),
          h('button', { disabled: true }, 'Return Shard'),
          h('div.received', new Date(timestamp).toLocaleDateString())
        ])

      case REQUESTED:
        return h('div.shard -requested', [
          h('div.avatar', avatar(author)),
          h('div.name', name(author)),
          h('div.info', [
            h('i.fa.fa-warning'),
            ' - shard requested'
          ]),
          h('button -primary', { 'ev-click': returnShard }, 'Return Shard'),
          h('div.received', new Date(timestamp).toLocaleDateString())
        ])

      case REPLIED:
        return h('div.shard -replied', [
          h('div.avatar', avatar(author)),
          h('div.name', name(author)),
          h('div.info', '(returned)'),
          h('div.received', new Date(timestamp).toLocaleDateString())
        ])
    }
  }

  function getRecords () {
    pull(
      scuttle.shard.pull.fromOthers({ reverse: true, live: false }),
      pull.paramap((shard, cb) => {
        const { root } = getContent(shard)
        pull(
          scuttle.root.pull.backlinks(root),
          pull.collect((err, msgs) => {
            if (err) return cb(err)

            msgs = sort(msgs)

            cb(null, {
              shard,
              requests: msgs.filter(isRequest),
              replies: msgs.filter(isReply)
            })
          })
        )
      }, 3), // "width 3"
      pull.collect((err, records) => {
        if (err) console.error(err)

        store.records.set(records)
      })
    )
  }

  function watchForUpdates () {
    // when any new messages come int related to this root, just get all the data again and write over it.
    // triggering a big render of who page...
    pull(
      scuttle.shard.pull.fromOthers({ live: true, old: false }),
      pull.filter(m => !m.sync),
      pull.drain(m => getRecords())
    )

    // TODO watch for others requests + replies sent to others
    // actually only watch requests... 
  }
}

function identity (id) { return id }

function comparer (a, b) {
  return a && b && a.key === b.key
}

module.exports = DarkCrystalFriendsIndex
