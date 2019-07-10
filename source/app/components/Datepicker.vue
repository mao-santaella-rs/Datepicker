<template lang="pug">
.datepicker__container
  .datepicker(
    ref="datepicker"
    :class="{'datepicker--open' : open,'datepicker--two-panels' : monthsToShow === 2}"
  )
    .datepicker__responsive-header
      span {{computedDateOneString}} - {{computedDateTwoString}}
    .datepicker__content
      .datepicker__month-container(
        ref="container"
        :class="{'datepicker--move-left' : panelMove === 'left','datepicker--move-right' : panelMove === 'right'}"
      )
        .datepicker__month(
          v-for="month in calendar"
          :key="`month-${month.month}-${month.year}`"
        )
          a.datepicker__month__name(
            @click="monthSelectOpen = true"
          )
            span {{months[month.month]}} {{month.year}}

          .datepicker__month__weekdays
            .datepicker__day-title(
              v-for="day in days"
              :key="`weekday-${day}`"
            ) {{day}}

          .datepicker__month__calendar
            .datepicker__day.datepicker__day--null(
              v-for="nullDay in month.null"
              :class="{'datepicker__day--last-null' : nullDay === month.null}"
              :key="`nullday-${nullDay}`"
            )
            button.datepicker__day(
              v-for="day in month.days"
              :class="dayStyles(day.date)",
              @click="() => dayClick(day.date)"
              :key="`day-${month.month}-${day.number}-${month.year}`"
            ) 
              span {{day.number}}

      button.datepicker__controls__prev(@click="panelMove = 'left'")
      button.datepicker__controls__next(@click="panelMove = 'right'")
    
    .datepicker__footer
      button.datepicker__cancel-btn(@click="cancelClick") Cancel
      button.datepicker__apply-btn(
        @click="applyClick"
        :class="{ 'datepicker__apply-btn--disabled': selectionCount === 2 || initialDateOne === selectionDateOne }"
      ) Apply

    .datepicker__monthpicker(v-if="monthSelectOpen")
      .datepicker__monthpicker__header
        a.datepicker__monthpicker__year(
          @click="yearSelectOpen = true"
        )
          span {{computedPanelDate.year}}

      .datepicker__monthpicker__content
        button(
          v-for="(month,index) in months"
          @click="() => monthClick(index)"
          :class="{'datepicker__day--today' : index === computedPanelDate.month}"
          :key="`month-${month}`"
        ) {{month}}

    .datepicker__yearpicker(v-if="yearSelectOpen")
      .datepicker__yearpicker__content
        button(
          v-for="year in yearsList"
          :class="{'datepicker__day--today' : year === computedPanelDate.year}"
          @click="() => yearClick(year)"
          :key="`year-${year}`"
        ) {{year}}

</template>

<script>
// date-fns imports
const differenceInDays = require('date-fns/difference_in_calendar_days')
const getYear = require("date-fns/get_year")
const getDay = require("date-fns/get_day")
const getDaysInMonth = require("date-fns/get_days_in_month")
const isSameDay = require("date-fns/is_same_day")
const isWithinRange = require("date-fns/is_within_range")
const isDate = require("date-fns/is_date")
const isBefore = require("date-fns/is_before")
const isAfter = require("date-fns/is_after")
const addDays = require('date-fns/add_days')
const addMonths = require("date-fns/add_months")
const subDays = require('date-fns/sub_days')
const subMonths = require("date-fns/sub_months")
const getMonth = require("date-fns/get_month")
const format = require("date-fns/format")

export default {
  name: "Datepicker",
  props: {
    dateOne: {
      type: String,
      default: ''
    },
    dateTwo: {
      type: String,
      default: ''
    },
    minDate: {
      type: String,
      default: ""
    },
    maxDate: {
      type: String,
      default: ""
    },
    disabledDays: {
      // TODO when is in between the selection?
      type: Array,
      default: () => [] // ['09-14-2018','09-15-2018']
    },
    monthsToShow: {
      type: Number,
      default: 1
    },
    maxRangeDays: {
      type: Number,
      default: 0,
      validator: function (val) {
        return val > 5 || val === 0
      }
    },
    open: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      today: null,
      months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      selectionCount: 1,
      selectionDateOne: null,
      selectionDateTwo: null,
      initialDateOne: null,
      initialDateTwo: null,
      panelMove: '',
      panelDate: null,
      monthSelectOpen: false,
      yearSelectOpen: false
    }
  },
  watch:{
    open(val){
      if (val) {
        // load the dates from the props to the internal selection
        this.propDatesToSelection()
        // event listener to detect a click outside of the component 
        document.addEventListener('mousedown', this.outsideClick)
      } else {
        // add the listener when open and remove it when close
        document.removeEventListener('mousedown', this.outsideClick)
      }
    }
  },
  mounted() {
    // create the today date
    this.today = new Date()
    // create the current panel date
    this.panelDate = new Date(getYear(this.today), getMonth(this.today))
    this.propDatesToSelection()
    // event listener for the timing on the slide transition
    this.$refs.container.addEventListener(this.whichTransitionEvent(), this.afterTransition)
  },
  beforeDestroy() {
    // remove all listeners
    this.$refs.container.removeEventListener(this.whichTransitionEvent(), this.afterTransition)
    document.removeEventListener('mousedown', this.outsideClick)
  },
  methods: {
    applyClick(){
      this.$emit('close')
    },
    cancelClick(){
      // revert the changes
      this.updatePropDates(this.initialDateOne,this.initialDateTwo)
      this.$emit('close')
    },
    updatePropDates(dateOne,dateTwo){
      this.$emit('update:dateOne', dateOne ? format(dateOne,'MM-DD-YYYY') : '')
      this.$emit('update:dateTwo', dateTwo ? format(dateTwo,'MM-DD-YYYY') : '')
    },
    outsideClick(event) {
      if (!this.$refs.datepicker.contains(event.target)) this.$emit('close')      
    },
    dayClick(date) {
      if (this.selectionCount === 1) {
        this.selectionDateOne = date
        this.selectionDateTwo = null
        this.selectionCount = 2
      } 
      // if the second selection is before the first
      else if (isBefore(date, this.selectionDateOne)) {
        // if the range it's over the maxRangeDays adjust it to dateTwo
        if (this.maxRangeDays > 0 && differenceInDays(this.selectionDateOne,date) > this.maxRangeDays -1){
          this.selectionDateTwo = addDays(date,this.maxRangeDays-1)
        } else {
          // else asign dateOne to dateTwo
          this.selectionDateTwo = this.selectionDateOne
        }
        this.selectionDateOne = date
        this.selectionCount = 1
      } else {
        this.selectionDateTwo = date
        
        // if with the second selection the range is greater than maxRangeDays adjust it
        if (this.maxRangeDays > 0 && differenceInDays(date,this.selectionDateOne) > this.maxRangeDays -1){
          this.selectionDateOne = subDays(date,this.maxRangeDays-1)
        }
        this.selectionCount = 1
      }
      // stream the dates
      this.updatePropDates(this.selectionDateOne,this.selectionDateTwo)
    },
    dayStyles(date) {
      const isBeforeMinDay = this.computedMinDate
        ? isBefore(date, this.computedMinDate)
        : false
      const isAfterMaxDay = this.computedMaxDate
        ? isAfter(date, this.computedMaxDate)
        : false
      const isDisabledDay = this.disabledDays.length
        ? this.disabledDays.some(val => isSameDay(date, this.getDateFromString(val)))
        : false
      return {
        "datepicker__day--today": isSameDay(date, this.today),
        'datepicker__day--selected-one': isSameDay(date, this.selectionDateOne),
        'datepicker__day--selected-two': isSameDay(date, this.selectionDateTwo),
        "datepicker__day--in-range": isDate(this.selectionDateTwo)
          ? isWithinRange(date, this.selectionDateOne, this.selectionDateTwo)
          : false,
        "datepicker__day--disabled": isBeforeMinDay || isAfterMaxDay || isDisabledDay
      }
    },
    monthClick(index){
      this.panelDate = new Date(this.computedPanelDate.year,index)
      this.monthSelectOpen = false
    },
    yearClick(year){
      this.panelDate = new Date(year,this.computedPanelDate.month)
      this.yearSelectOpen = false
    },
    buildMonth(date) {
      let year = getYear(date)
      let month = getMonth(date)
      let days = []
      
      for (let day = 1; day <= getDaysInMonth(date); day++) {
        days.push({
          number: day,
          date: new Date(year,month,day)
        })
      }
      return {
        year: year,
        month: month,
        days: days,
        // this will give the index of the weekday of the first day of the month
        null: getDay(date)
      }
    },
    getDateFromString(string) {
      let dateArr = string.split("-").map(el => Number(el))
      return new Date(dateArr[2], dateArr[0] - 1, dateArr[1])
    },
    // this method will return a cross-browser property of the transition 
    whichTransitionEvent(){
      const transitions = {
        "transition" : "transitionend",
        "OTransition" : "oTransitionEnd",
        "MozTransition" : "transitionend",
        "WebkitTransition" : "webkitTransitionEnd"
      }
      for (let t in transitions){
        if (this.$refs.container.style[t] !== undefined){
          return transitions[t]
        }
      }
    },
    // after the transition end the computed calendar will update
    afterTransition(event){
      if (event.propertyName !== "transform") return
      if (this.panelMove === 'left'){
        this.panelDate = subMonths(this.panelDate,1)
      } else if (this.panelMove === 'right') {
        this.panelDate = addMonths(this.panelDate,1)
      }
      this.panelMove = ''
    },
    propDatesToSelection(){
      if (this.dateOne !== '') {
        this.selectionDateOne = this.getDateFromString(this.dateOne)
        this.initialDateOne = this.selectionDateOne
      }
      if (this.dateTwo !== '') {
        this.selectionDateTwo = this.getDateFromString(this.dateTwo)
        this.initialDateTwo = this.selectionDateTwo
      }
    }
  },
  computed: {
    computedDateOneString(){
      return this.selectionDateOne ? format(this.selectionDateOne,'MM-DD-YYYY') : 'MM-DD-YYYY'
    },
    computedDateTwoString(){
      return this.selectionDateTwo ? format(this.selectionDateTwo,'MM-DD-YYYY') : 'MM-DD-YYYY'
    },
    computedMinDate() {
      return this.minDate != '' ? this.getDateFromString(this.minDate) : false
    },
    computedMaxDate() {
      return this.maxDate != '' ? this.getDateFromString(this.maxDate) : false
    },
    computedPanelDate() {
      return {
        year: getYear(this.panelDate),
        month: getMonth(this.panelDate)
      }
    },
    // list for the year selection
    yearsList(){
      const minYear = getYear(this.today) - 15
      let yearList = []
      for (let year = minYear; year <= minYear + 31; year++) {
        yearList.push(year)
      }
      return yearList
    },
    calendar(){
      if (!this.today) return []
      let calendar = []
      // it will load 4 months everi time it updates one before and one after for the transition and the extra for the 2 panel view
      for (let date = subMonths(this.panelDate,1) ; !isSameDay(date,addMonths(this.panelDate,3)) ; date = addMonths(date,1)) {
        calendar.push(this.buildMonth(date))
      }
      return calendar
    }
  }
}
</script>

<style lang="sass" scoped>
$color-black: #000
$color-dark-gray: #404040
$color-gray: #808080
$color-light-gray: #f1f1f1

$color-border: #e6eaee

$component-width: 305px
$day-width: 35px

::-webkit-scrollbar
  width: 5px

::-webkit-scrollbar-track
  background: #f1f1f1

::-webkit-scrollbar-thumb
  background: #888

::-webkit-scrollbar-thumb:hover
  background: #555

button
  cursor: pointer
  border: none
  &:focus
    outline: none

.datepicker__container
  position: relative

.datepicker
  font-size: 12px
  border: 1px solid $color-border
  max-width: $component-width
  background-color: #fff
  position: absolute
  top: 0
  left: 0
  opacity: 0
  pointer-events: none
  transition: opacity 0.2s ease-in-out

.datepicker--open
  opacity: 1
  pointer-events: initial

.datepicker--two-panels
  max-width: calc(#{$component-width} * 2)

.datepicker__content
  position: relative
  overflow: hidden

.datepicker__month-container
  display: flex
  transform: translate(-#{$component-width},0)

.datepicker--move-right, .datepicker--move-left
  transition: transform 0.3s ease-in-out

.datepicker--move-right
  transform: translate(-#{$component-width *2},0)

.datepicker--move-left
  transform: translate(0,0)

.datepicker__month
  min-width: $component-width
  padding: 30px 30px 15px
  flex: 0

.datepicker__month__name
  display: block
  text-align: center
  padding-bottom: 25px
  cursor: pointer
  span
    color: $color-dark-gray
    font-size: 20px
    font-weight: 500

.datepicker__month__weekdays
  display: flex
  justify-content: space-between
  margin-bottom: 10px
  color: $color-gray
  opacity: .5

.datepicker__day-title
  flex: 1
  text-align: center
  font-weight: 100

.datepicker__month__calendar
  display: flex
  flex-wrap: wrap
  align-content: flex-start
  height: calc(#{$day-width} *6)

.datepicker__day
  flex: 0 0 calc(100% /7)
  display: flex
  justify-content: center
  align-items: center
  height: $day-width
  color: $color-dark-gray
  position: relative
  &:hover
    &:after
      opacity: 0.5
  &:focus
    outline: none
  &:after
    content: ""
    display: block
    width: 100%
    height: 100%
    border-radius: calc(#{$day-width} /2)
    border: 1px solid $color-gray
    position: absolute
    top: 0
    left: 0
    opacity: 0

  span
    position: relative
    line-height: 1em

.datepicker__day--null
  pointer-events: none
  opacity: 0

.datepicker__day--today
  font-weight: 700


.datepicker__day--in-range
  background-color: $color-light-gray

.datepicker__day--selected-one, .datepicker__day--selected-two
  color: #fff
  &:before
    content: ""
    display: block
    width: 100%
    height: 100%
    background-color: $color-black
    position: absolute
    top: 0
    left: 0
    border-radius: calc(#{$day-width} /2)
  &:hover, &:focus
    color: #fff

.datepicker__day--selected-one
  border-radius: calc(#{$day-width} /2) 0 0 calc(#{$day-width} /2)

.datepicker__day--selected-two
  border-radius: 0 calc(#{$day-width} /2) calc(#{$day-width} /2) 0


.datepicker__day--disabled
  opacity: 0.3
  pointer-events: none

.datepicker__controls

.datepicker__controls__prev, .datepicker__controls__next
  width: $day-width
  height: $day-width
  color: $color-gray
  position: absolute
  top: 20px
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' x='0px' y='0px' viewBox='0 0 16 16' enable-background='new 0 0 16 16' xml:space='preserve'><polygon points='15,12 8,5 1,12 0,12 8,4 16,12 '/></svg>")
  background-size: 16px 16px
  background-repeat: no-repeat
  background-position: center
  padding: 0
  &:hover
    position: absolute

.datepicker__controls__prev
  left: 15px
  transform: rotate(-90deg)

.datepicker__controls__next
  right: 15px
  transform: rotate(90deg)

.datepicker__monthpicker
  position: absolute
  top: 0
  bottom: 0
  background-color: #fff
  display: flex
  flex-direction: column
  justify-content: center
  padding: 0 30px 30px

.datepicker__monthpicker__header
  display: flex
  justify-content: center


.datepicker__monthpicker__content
  display: flex
  flex-wrap: wrap
  border: 1px solid $color-border
  border-bottom: 0
  button
    flex: 0 0 calc(100% /3)
    padding: 20px 0
    border-left: 1px solid $color-border
    border-bottom: 1px solid $color-border
    &:nth-child(3n+1)
      border-left: none

.datepicker__monthpicker__year
  @extend .datepicker__month__name
  padding-top: 0
  padding-bottom: 20px
  span
    font-size: 22px

.datepicker__yearpicker
  @extend .datepicker__monthpicker
  justify-content: flex-start
  overflow: hidden
  overflow-y: auto
  padding: 0

.datepicker__yearpicker__content
  display: flex
  flex-wrap: wrap
  button
    flex: 0 0 calc(100% /4)
    padding: 20px 0
    border-left: 1px solid $color-border
    border-bottom: 1px solid $color-border

    &:nth-child(4n+1)
      border-left: none

.datepicker__footer
  display: flex
  justify-content: space-between
  padding: 0 30px 30px

.datepicker__apply-btn, .datepicker__cancel-btn
  font-size: 14px
  font-weight: 600

.datepicker__cancel-btn
  color: $color-gray

.datepicker__apply-btn--disabled
  @extend .datepicker__day--disabled



.datepicker__responsive-header
  display: none
  justify-content: center
  padding-top: 30px

  span
    font-size: 17px
    color: $color-gray

@media screen and (max-width: 750px)
  .datepicker--two-panels
    max-width: $component-width

@media screen and (max-width: 450px)
  .datepicker
    max-width: initial
    position: fixed
    right: 0
    bottom: 0

  .datepicker__responsive-header
    display: flex

  .datepicker__month-container
    transform: translate(-100%,0)

  .datepicker--move-right
    transform: translate(-200%,0)

  .datepicker--move-left
    transform: translate(0,0)

  .datepicker__month
    min-width: 100%
</style>
