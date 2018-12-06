const { h, Value, when  } = require('mutant')

const AreYouSure = require('../component/are-you-sure')

module.exports = function DarkCrystalForwardAll ({ scuttle, modal, shards }) {
  const forwarding = Value(false)
  const warningOpen = Value(false)

  return h('div.forward', [
    h('button', {
      'ev-click': (e) => warningOpen.set(true) 
    }, when(forwarding,
      h('i.fa.fa-spinner.fa-pulse'),
      'Forward All Shards'
    )),
    warningModal()
  ])

  function warningModal () {
    const message = "HERES A BUNCH OF TEXT THAT TELLS YOU TO BE SUPER CAREFUL"

    const onSubmit = () => {
      console.log("PUBLISHING FORWARD MESSAGES AND CLOSING MODAL")
      warningOpen.set(false)
    }

    const onCancel = () => {
      console.log("GOING BACK, WE CHICKENED OUT")
      warningOpen.set(false)
    }

    return modal(
      AreYouSure({ message, onSubmit, onCancel }),
      { isOpen: warningOpen }
    )
  }
}

