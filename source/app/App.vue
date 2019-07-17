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
    min-date="12-05-2016"
    max-date="03-25-2021"
    :date-one.sync="dates.firstDate"
    :date-two.sync="dates.lastDate"
    :months-to-show="panels"
    :max-range-days="90"
  )
  
</template>

<script>
import Datepicker from './components/Datepicker'

export default {
  name: 'App',
  components: {
    Datepicker
  },
  data(){
    return{
      dates:{
        firstDate: '',
        lastDate: '',
      },
      panels: 2,
      datePickerOpen: false
    }
  }
}
</script>

<style lang="sass">
body
  padding: 50px

a
  cursor: pointer
</style>
