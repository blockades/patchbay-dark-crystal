const { h, resolve, Value, computed, when } = require('mutant')

const Cropper = require('../../lib/cropper')

module.exports = function AccountEdit (opts) {
  const {
    addBlob,
    avatar,
    name,
    publish,
    onCancel,
    feedId,
    blobUrl
  } = opts

  const state = {
    isSaving: Value(false),
    name: Value(),
    avatar: Value()
  }

  return (
    h('div.account', [
      h('div.personal', [
        h('div.inputs', [
          h('div.avatar', [
            h('label.avatar', 'Avatar'),
            Cropper({ addBlob, image: state.avatar })
          ]),
          h('div.name', [
            h('label.name', 'Name'),
            computed(name(feedId), name => (
              h('input.name', {
                value: name,
                'ev-input': (e) => state.name.set(e.target.value)
              })
            ))
          ])
        ]),
        h('div.current', [
          computed(state.avatar, img => (img ? h('img.avatar', { src: blobUrl(img.link) }) : avatar(feedId, 10)))
        ])
      ]),
      h('div.actions', when(state.isSaving,
        h('i.fa.fa-spinner.fa-pulse'),
        [
          h('button -subtle', { 'ev-click': onCancel }, 'Cancel'),
          h('button -primary', { 'ev-click': () => {
            state.isSaving.set(true)
            const name = resolve(state.name)
            const image = resolve(state.avatar)

            publishAbout({ name, image }, (err, about) => {
              state.isSaving.set(false)
              if (err) throw err
              else onCancel()
            })
          } }, 'Save')
        ]
      ))
    ])
  )

  function publishAbout (params, callback) {
    publish({
      type: 'about',
      about: feedId,
      ...params
    }, callback)
  }
}

