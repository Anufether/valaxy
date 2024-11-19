import type { PluginOption } from 'vite'

import Vue from '@vitejs/plugin-vue'
import Layouts from 'vite-plugin-vue-layouts'
import Components from 'unplugin-vue-components/vite'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'

import UnheadVite from '@unhead/addons/vite'

import { resolve } from 'pathe'
import consola from 'consola'
import type { ValaxyServerOptions } from '../options'
import type { ValaxyNode } from '../types'

import { customElements } from '../constants'
import { createUnocssPlugin } from './unocss'
import { createConfigPlugin } from './extendConfig'
import { createClientSetupPlugin } from './setupClient'
import { createFixPlugins } from './patchTransform'
import { createRouterPlugin } from './vueRouter'
import { createValaxyLoader } from './valaxy'
import { createMarkdownPlugin } from './markdown'

export async function ViteValaxyPlugins(
  valaxyApp: ValaxyNode,
  serverOptions: ValaxyServerOptions = {},
): Promise<(PluginOption | PluginOption[])[]> {
  const { options } = valaxyApp
  const { roots, config: valaxyConfig } = options

  const MarkdownPlugin = await createMarkdownPlugin(options)
  const ValaxyLoader = await createValaxyLoader(options, serverOptions)

  const plugins: (PluginOption | PluginOption[])[] = [
    MarkdownPlugin,
    createConfigPlugin(options),
    createClientSetupPlugin(options),
    Vue({
      include: [/\.vue$/, /\.md$/],
      exclude: [],
      template: {
        compilerOptions: {
          isCustomElement: (tag) => {
            let is = customElements.has(tag)
            valaxyConfig.vue?.isCustomElement?.forEach((fn) => {
              is = is || fn(tag)
            })
            return is
          },
        },
      },
      ...valaxyConfig.vue,
    }),

    ValaxyLoader,

    UnheadVite(),

    // https://github.com/posva/unplugin-vue-router
    await createRouterPlugin(valaxyApp),

    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts({
      layoutsDirs: roots.map(root => `${root}/layouts`),

      ...valaxyConfig.layouts,
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      extensions: ['vue', 'md'],

      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      exclude: [],

      // allow override
      allowOverrides: true,
      // override: user -> theme -> client
      // latter override former
      dirs: roots
        .map(root => `${root}/components`)
        .concat(['src/components', 'components']),
      dts: resolve(options.tempDir, 'components.d.ts'),

      ...valaxyConfig.components,
    }),

    // https://github.com/antfu/unocss
    // UnocssPlugin,
    await createUnocssPlugin(options),

    // ...MarkdownPlugin,

    // https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: roots.map(root => `${root}/locales/**`),

      // items merged by defu will be treated as array, we should override it
      jitCompilation: false,
    }),

    createFixPlugins(options),
  ]

  if (valaxyConfig.visualizer) {
    try {
      const visualizer = (await import('rollup-plugin-visualizer')).visualizer
      plugins.push(
        visualizer({
          open: true,
          gzipSize: true,
          ...valaxyConfig.visualizer,
        }),
      )
    }
    catch (e) {
      console.error('Failed to load rollup-plugin-visualizer')
      consola.error('Please install `rollup-plugin-visualizer` to enable the feature')
      // eslint-disable-next-line no-console
      console.log()
      consola.info('pnpm add -D rollup-plugin-visualizer')
      // eslint-disable-next-line no-console
      console.log()
    }
  }
  return plugins
}
