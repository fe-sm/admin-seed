<script>
import Vue from 'vue'
import { Component, Watch } from 'vue-property-decorator'
import { State, Action } from 'vuex-class'
import { LocaleProvider } from 'ant-design-vue'
import { axiosInstance } from '@/apis'
import { showErrorTip } from '@/utils/helpers'
import { transformTo } from '@/i18n/setup'
import './App.less'

@Component()
class App extends Vue {
  inited = false

  @State locale
  @State antdLocale
  @Action loadAntdLocale
  @Action loadLangs

  beforeMount () {
    function walk (xs) {
      xs.forEach((x) => {
        if (x.meta && x.meta.labelKeyI18n) {
          x.meta.label = transformTo(x.meta.labelKeyI18n)
        }

        if (x.children) {
          walk(x.children)
        }
      })
    }
    walk(this.$router.options.routes)
  }

  @Watch('locale', { immediate: true })
  handleLocaleChange (locale) {
    // If you need to set the `Accept-Language`, use following codes
    const [first, second] = locale.split('_')
    axiosInstance.defaults.headers.common['Accept-Language'] = `${first}-${second},${first};q=0.9`

    this.load().then(() => {
      this.inited = true

      document.title = this.$t('common.title')
    }, () => {
      showErrorTip(new Error(this.$t('error.GET_LOCALE_INFO_ERROR')))
    })
  }

  load () {
    return Promise.all([
      this.loadAntdLocale(this.locale),
      this.loadLangs()
    ])
  }

  render () {
    let Content = null
    if (this.inited) {
      Content = <router-view />
    }
    return (
      <LocaleProvider locale={this.antdLocale}>
        {Content}
      </LocaleProvider>
    )
  }
}

export default App
</script>
