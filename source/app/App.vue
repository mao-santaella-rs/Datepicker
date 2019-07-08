<template lang="pug">
#app
  .container
    span from: {{dates.firstDate}} to: {{dates.lastDate}}
    br
    a(href="#" @click="panels = panels == 1 ? 2 : 1") show 1 or 2 months
    br
    a(href="#" @click="datePickerOpen = !datePickerOpen") open / close
    br
  Datepicker(
    :open="datePickerOpen"
    min-date="12-05-2016"
    max-date="03-25-2021"
    :date-one="dates.firstDate"
    :date-two="dates.lastDate"
    :months-to-show="panels"
    :max-range-days="20"
    @update:dateOne="val => dates.firstDate = val"
    @update:dateTwo="val => dates.lastDate = val"
    @close="datePickerOpen = false"
  )
  p Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas nisl lacus, fringilla et ex eget, vestibulum semper urna. Ut id varius nisl. Donec sapien justo, tincidunt vitae diam aliquet, sagittis posuere lectus. Nunc ultrices massa non porta vehicula. Sed lobortis orci non neque ultrices posuere. Phasellus ornare tempor purus sit amet finibus. Mauris tempus volutpat commodo. Proin quis laoreet urna. Nunc sapien tellus, accumsan et orci at, auctor blandit mi. Quisque vitae lectus lacus. Donec consequat justo sed auctor elementum. Nullam porttitor consequat sapien eu ultricies. Donec a tincidunt nisl, sit amet pulvinar nulla.

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
      panels: 1,
      datePickerOpen: false
    }
  }
}
</script>

<style lang="sass">
body
  padding: 50px

button
  padding: 0
  border-radius: 0
  background-color: #fff
  &:hover, &:focus
    outline: none
</style>
