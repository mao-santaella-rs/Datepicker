<template lang="pug">
#app
  .container
    span from: {{dates.firstDate}} to: {{dates.lastDate}}
    br
    a(@click="panels = panels == 1 ? 2 : 1") show 1 or 2 months
    br
    a(@click="datePickerOpen = !datePickerOpen") open / close
    br
  Datepicker(
    :open.sync="datePickerOpen"
    :date-one.sync="dates.firstDate"
    :date-two.sync="dates.lastDate"
    :months-to-show="panels"
    :max-range-days="90"
    date-format="MM/dd/yyyy"
  )
  .container
    p Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi pulvinar gravida metus sed sollicitudin. Donec tellus ligula, maximus sed tellus id, sagittis egestas purus. Pellentesque ac vestibulum augue. In ultrices sollicitudin neque, eu vehicula purus luctus vitae. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pulvinar eros et dapibus blandit. Maecenas id elit elit. Curabitur semper commodo porttitor. Pellentesque porttitor augue ut quam commodo, nec congue lorem venenatis. Nullam hendrerit ipsum euismod gravida scelerisque. Sed dictum nunc ante, ut posuere nisl hendrerit ac. 
  Datepicker(
    :date-one.sync="dates.firstDate"
    :date-two.sync="dates.lastDate"
    :months-to-show="panels"
    date-format="MM/dd/yyyy"
    block
  )
  .container
    p Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi pulvinar gravida metus sed sollicitudin. Donec tellus ligula, maximus sed tellus id, sagittis egestas purus. Pellentesque ac vestibulum augue. In ultrices sollicitudin neque, eu vehicula purus luctus vitae. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pulvinar eros et dapibus blandit. Maecenas id elit elit. Curabitur semper commodo porttitor. Pellentesque porttitor augue ut quam commodo, nec congue lorem venenatis. Nullam hendrerit ipsum euismod gravida scelerisque. Sed dictum nunc ante, ut posuere nisl hendrerit ac. 
  
</template>

<script>
import Datepicker from './components/Datepicker'

export default {
  name: 'App',
  components: {
    Datepicker,
  },
  data() {
    return {
      dates: {
        firstDate: '',
        lastDate: '',
      },
      panels: 2,
      datePickerOpen: false,
    }
  },
}
</script>

<style lang="sass">
body
  padding: 50px

a
  cursor: pointer
</style>
