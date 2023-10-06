import { defineAppSetup, scrollTo } from 'valaxy'
import { nextTick } from 'vue'

import 'vitepress/dist/client/theme-default/styles/vars.css'

// import 'vitepress/dist/client/theme-default/styles/base.css'
// import 'vitepress/dist/client/theme-default/styles/utils.css'
// import 'vitepress/dist/client/theme-default/styles/components/vp-code.css'
import 'vitepress/dist/client/theme-default/styles/components/vp-code-group.css'
import 'vitepress/dist/client/theme-default/styles/components/vp-doc.css'
import 'vitepress/dist/client/theme-default/styles/components/custom-block.css'

// import 'vitepress/dist/client/theme-default/styles/components/vp-sponsor.css'

import { targetPadding } from '../client'

export default defineAppSetup((ctx) => {
  const { router, isClient } = ctx
  if (!isClient)
    return

  window.addEventListener(
    'click',
    async (e) => {
      const link = (e.target as Element).closest('a')
      if (link) {
        const { protocol, hostname, pathname, hash, target } = link
        const currentUrl = window.location
        const extMatch = pathname.match(/\.\w+$/)
        // only intercept inbound links
        if (
          !e.ctrlKey
            && !e.shiftKey
            && !e.altKey
            && !e.metaKey
            && target !== '_blank'
            && protocol === currentUrl.protocol
            && hostname === currentUrl.hostname
            && !(extMatch && extMatch[0] !== '.html')
        ) {
          if (pathname === currentUrl.pathname) {
            e.preventDefault()
            // scroll between hash anchors in the same page
            if (hash && hash !== currentUrl.hash) {
              await router.push({ hash })
              history.replaceState({ ...history.state }, '')

              // still emit the event so we can listen to it in themes
              window.dispatchEvent(new Event('hashchange'))
              // use smooth scroll when clicking on header anchor links
              scrollTo(link, hash, {
                smooth: link.classList.contains('header-anchor'),
              })
            }
          }
        }
      }
    },
    { capture: true },
  )

  window.addEventListener('hashchange', (e) => {
    e.preventDefault()
  })

  router.beforeEach((to, from) => {
    if (to.path !== from.path)
      return

    nextTick(() => {
      scrollTo(document.body, to.hash, {
        smooth: true,
        targetPadding,
      })
    })
  })
})
