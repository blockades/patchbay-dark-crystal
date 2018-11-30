const { h, Value, computed, when } = require('mutant')

// NOTE - these are currently connect to mcss + state switching
const RECEIVED = 'received'
const REQUESTED = 'requested'
const RETURNED = 'returned'

module.exports = function DarkCrystalShowFriend (opts) {
  const {
    avatar = identity,
    name = identity,
    friends, // obs
    selectedFriend, // obs
    onCancel,
    scuttle
  } = opts

  return h('DarkCrystalFriendShow', computed([friends, selectedFriend], (friends, feedId) => {
    const i = friends.findIndex(friend => friend.feedId === feedId)
    const { shards } = friends[i]

    function move (newIndex) {
      selectedFriend.set(friends[newIndex].feedId)
    }

    return [
      i !== 0
        ? h('section.left', { 'ev-click': () => move(i - 1) }, h('i.fa.fa-chevron-left'))
        : h('section.left.-disabled', h('i.fa.fa-chevron-left')),
      h('section.body', [
        h('div.avatar', avatar(feedId, 6)),
        h('div.name', name(feedId)),
        h('div.shards', [
          shards.map(ShardDetailed)
        ]),
        h('div.actions', [
          h('button -subtle', { 'ev-click': onCancel }, 'Cancel')
        ])
      ]),
      i !== friends.length - 1
        ? h('section.right', { 'ev-click': () => move(i + 1) }, h('i.fa.fa-chevron-right'))
        : h('section.right.-disabled', h('i.fa.fa-chevron-right'))
    ]
  }))

  function ShardDetailed (shard) {
    const { root, receivedAt, state } = shard

    switch (state) {
      case RECEIVED:
        return h('div.shard -received', [
          h('div.rts', receivedAt),
          h('button', { disabled: true, style: { visibility: 'hidden' } }, 'Return Shard') // TODO
        ])

      case REQUESTED:
        const returning = Value(false)
        const returnShard = () => {
          returning.set(true)
          scuttle.recover.async.reply(root, (err, data) => {
            if (err) throw err

            console.log('shard returned', data)
          })
        }

        return h('div.shard -requested', [
          h('div.rts', receivedAt),
          when(returning,
            h('div.info'),
            h('div.info', [
              h('i.fa.fa-warning'), ' - shard requested'
            ])
          ),
          when(returning,
            h('i.fa.fa-spinner.fa-pulse'),
            h('button -primary', { 'ev-click': returnShard }, 'Return Shard')
          )
        ])

      case RETURNED:
        return h('div.shard -returned', [
          h('div.rts', receivedAt),
          h('div.info', '(returned)')
        ])
    }
  }
}

function identity (id) { return id }
