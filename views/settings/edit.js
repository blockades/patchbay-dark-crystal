const { h, resolve, Value, computed, when } = require('mutant')
const dataurl = require('dataurl-')
const hyperfile = require('hyperfile')
const hypercrop = require('hypercrop')
const hyperlightbox = require('hyperlightbox')
const pull = require('pull-stream')

module.exports = function SettingsEdit (opts) {
  const {
    scuttle,
    feedId,
    onCancel = console.log,
    avatar = identity,
    name = identity,
    publish,
    blobUrl,
    addBlob,
  } = opts

  const currentName = name(feedId)
  const newName = Value()

  var currentAvatar = avatar(feedId)
  const newAvatar = Value()

  const displayAvatar = computed(newAvatar, img => (
    img ? h('img', { src: blobUrl(img.link) }) : currentAvatar
  ))

  const canSave = Value(false)

  var lightbox = hyperlightbox()

  return h('Settings', [
    h('section -avatar', [
      lightbox,
      h('header', 'Avatar'),
      h('div.input', [
        displayAvatar,
        hyperfile.asDataURL((data) => {
          lightbox.show(Crop(data, (err, cropData) => {
            if (err) throw err
            if (!cropData) return lightbox.close()

            var _data = dataurl.parse(cropData)

            addBlob(pull.once(_data.data), (err, hash) => {
              if (err) throw err

              newAvatar.set({
                link: hash,
                size: _data.data.length,
                type: _data.mimetype,
                width: 512,
                height: 512
              })
            })
            lightbox.close()
          }))
        })
      ])
    ]),
    h('section -name', [
      h('header', 'Name'),
      computed(currentName, name => {
        return h('input', { value: name, 'ev-input': (e) => newName.set(e.target.value) })
      })
    ]),
    h('div.actions', [
      h('button', { 'ev-click': onCancel }, 'Cancel'),
      h('button -primary', { 'ev-click': () => {
        publish({
          type: 'about',
          about: feedId,
          image: resolve(newAvatar),
          name: resolve(newName),
        }, (err, about) => {
          console.log(about)
        })
      }, className: when(canSave, '', '-disabled') }, 'Save')
    ])
  ])
}

function Crop (data, callback) {
  var img = h('img', { src: data })
  var crop = Value()
  waitForImg()

  return h('div.cropper', [
    crop,
    h('div.background')
  ])

  function waitForImg () {
    if (!img.height && !img.width) return setTimeout(waitForImg, 100)

    var canvas = hypercrop(img)
    crop.set(
      h('PatchProfileCrop', [
        h('header', 'Click and drag to crop your avatar'),
        canvas,
        h('section.actions', [
          h('Button', { 'ev-click': () => callback() }, 'Cancel'),
          h('Button -primary', { 'ev-click': () => callback(null, canvas.selection.toDataURL()) }, 'OK')
        ])
      ])
    )
  }
}
