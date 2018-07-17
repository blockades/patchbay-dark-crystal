// run this with electro:
// npx electro views/new.test.js

const fs = require('fs')
const path = require('path')
const h = require('mutant/h')
const compile = require('micro-css')

const viewName = 'new'
const DarkCrystalNew = require(`./${viewName}`)

const opts = {
  scuttle: {},
  suggest: {
    about: () => {}
  },
  avatar: i => i,
  i18n: i => i
}

const page = DarkCrystalNew(opts)

document.body.appendChild(page)


// TODO find a better way to load relevant styles

fs.readFile(path.join(__dirname, `${viewName}.mcss`), 'utf8', (err, mcss) => {
  if (err) throw err

  const style = h('style', compile(mcss))
  document.head.appendChild(style)
})

fs.readFile(path.join(__dirname, 'component/recipients.mcss'), 'utf8', (err, mcss) => {
  if (err) throw err

  const style = h('style', compile(mcss))
  document.head.appendChild(style)
})
