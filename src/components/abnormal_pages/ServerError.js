import Figure from './Figure'

export default {
  name: 'ServerError',
  // functional: true,
  render () {
    return (
      <Figure class="serve-error" message="500" description={this.$t('abnormal.servicesAbnormal')}>
        <i class="icon icon-exception icon-exception-500"></i>
      </Figure>
    )
  }
}
