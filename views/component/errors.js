const { h, map, resolve, computed } = require('mutant')

function Errors (title, errors) {
  // errors should be an Array of Strings
  if (!errors) return
  if (isString(errors)) return Errors(title, [errors])
  if (isObject(errors)) return Errors(title, toArray(errors))

  return h('DarkCrystalErrors', [
    title,
    h('ul', map(errors, e => {
      return h('li', e.toString())
    }))
  ])
}

module.exports = Errors

function isString (i) {
  return typeof resolve(i) === 'string'
}

function isObject (i) {
  return typeof resolve(i) === 'object' &&
    resolve(i) !== null &&
    !Array.isArray(resolve(i))
}

function toArray (obj) {
  return computed(obj, obj => {
    return Object.keys(obj)
      .map(k => `${k}: ${obj[k].toString()}`)
  })
}
