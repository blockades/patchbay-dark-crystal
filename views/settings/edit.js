const { h, resolve, Value, computed, when } = require('mutant')

const Cropper = require('../lib/cropper')

module.exports = function SettingsEdit (opts) {
  const {
    feedId,
    onCancel = console.log,
    avatar = identity,
    name = identity,
    publish,
    blobUrl,
    addBlob
  } = opts

  const about = {
    type: 'about',
    about: feedId
  }

  const state = {
    isSaving: Value(false),
    name: Value(),
    avatar: Value()
  }

  return h('Settings', [
    h('h1', 'Settings'),
    h('section.inputs', [
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
    h('section.actions', when(state.isSaving,
      h('i.fa.fa-spinner.fa-pulse'),
      [
        h('button -subtle', { 'ev-click': onCancel }, 'Cancel'),
        h('button -primary', { 'ev-click': () => {
          state.isSaving.set(true)
          const name = resolve(state.name)
          const image = resolve(state.avatar)
          publish(Object.assign(about, { name, image }), (err, about) => {
            state.isSaving.set(false)
            if (err) throw err
            else onCancel()
          })
        } }, 'Save')
      ]
    ))
  ])
}

function identity (id) { return id }
