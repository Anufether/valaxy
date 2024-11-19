import { acceptHMRUpdate, defineStore } from 'pinia'
import { useToggle } from '@vueuse/core'

export const usePressAppStore = defineStore('press-app', () => {
  // 右侧边栏
  const [isRightSidebarOpen, toggleRightSidebar] = useToggle()

  return {
    rightSidebar: {
      isOpen: isRightSidebarOpen,
      toggle: toggleRightSidebar,
    },
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(usePressAppStore, import.meta.hot))
