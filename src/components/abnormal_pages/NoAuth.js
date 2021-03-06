import Figure from './Figure'

export default {
  name: 'NoAuth',
  // functional: true,
  render () {
    return (
      <Figure class="no-auth" message="403" description={this.$t('abnormal.pageForbiddenm')}>
        <i class="icon icon-exception icon-exception-403"></i>
      </Figure>
    )
  }
}
