/*!
 * i18n support with lazy loading | bqliu
 * @see http://kazupon.github.io/vue-i18n/zh/guide/lazy-loading.html
 */

import { mapMutations, mapState } from 'vuex'
import setup, { loadLanguageAsync, isSupportedLang, defaultLocale } from './setup'

export default function withI18n (Component, LoadingComponent, ErrorComponent) {
  return {
    props: ['lang'],
    data () {
      const lang = isSupportedLang(this.lang) ? this.lang : defaultLocale
      this.SET_LOCALE(lang)

      return {
        loading: false,
        error: false,
        inited: false
      }
    },
    provide () {
      return {
        i18nLoadLanguageAsync: loadLanguageAsync
      }
    },
    methods: {
      ...mapMutations(['SET_LOCALE'])
    },
    computed: {
      ...mapState(['locale'])
    },
    watch: {
      // 暂时不考虑取消前一个
      locale: {
        handler (locale) {
          setup({ lang: this.locale }).then(() => {
            this.inited = true
          }).catch(() => {
            this.error = true
          }).finally(() => {
            this.loading = false
          })
        },
        immediate: true
      }
    },
    render () {
      if (this.loading || !this.inited) {
        return <LoadingComponent />
      }
      if (this.error) {
        return <ErrorComponent />
      }
      const props = { lang: this.lang, ...this.$attrs }
      return <Component {...{ props }} />
    }
  }
}
