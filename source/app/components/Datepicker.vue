<template lang="pug">
.datepicker__container
  .datepicker(
    :class="{'datepicker--open' : open,'datepicker--two-panels' : monthsToShow === 2}"
  )
    .datepicker__content
      .datepicker__month-container(
        ref="container"
        :class="{'datepicker--move-left' : panelMove === 'left','datepicker--move-right' : panelMove === 'right'}"
      )
        .datepicker__month(
          v-for="month in calendar"
          :key="`month-${month.month}`"
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
            button.datepicker__day.datepicker__btn(
              v-for="day in month.days"
              :class="dayStyles(day.date)",
              @click="() => dayClick(day.date)"
              :key="`day-${month.month}-${day.number}`"
            ) 
              span {{day.number}}

      button.datepicker__controls__prev.datepicker__btn(@click="panelMove = 'left'") <
      button.datepicker__controls__next.datepicker__btn(@click="panelMove = 'right'") >
    
    .datepicker__monthpicker(v-if="monthSelectOpen")
      .datepicker__monthpicker__header
        a.datepicker__monthpicker__year(
          @click="yearSelectOpen = true"
        )
          span {{computedPanelDate.year}}

      .datepicker__monthpicker__content
        button.datepicker__btn(
          v-for="(month,index) in months"
          @click="() => monthClick(index)"
          :class="{'datepicker__day--today' : index === computedPanelDate.month}"
          :key="`month-${month}`"
        ) {{month}}

    .datepicker__yearpicker(v-if="yearSelectOpen")
      .datepicker__yearpicker__content
        button.datepicker__btn(
          v-for="year in yearsList"
          :class="{'datepicker__day--today' : year === computedPanelDate.year}"
          @click="() => yearClick(year)"
          :key="`year-${year}`"
        ) {{year}}

    .datepicker__footer
      button(@click="applyClick") Apply
      button(@click="cancelClick") Cancel

</template>

<script>
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
      if (val) this.propDatesToSelection()
    }
  },
  mounted() {
    this.today = new Date()
    this.panelDate = new Date(getYear(this.today), getMonth(this.today))
    this.propDatesToSelection()
    this.$refs.container.addEventListener(this.whichTransitionEvent(), this.afterTransition)
  },
  beforeDestroy() {
    this.$refs.container.removeEventListener(this.whichTransitionEvent(), this.afterTransition)
  },
  methods: {
    applyClick(){
      this.$emit('close')
    },
    cancelClick(){
      this.updatePropDates(this.initialDateOne,this.initialDateTwo)
      this.$emit('close')
    },
    updatePropDates(dateOne,dateTwo){
      this.$emit('update:dateOne', dateOne ? format(dateOne,'MM-DD-YYYY') : '')
      this.$emit('update:dateTwo', dateTwo ? format(dateTwo,'MM-DD-YYYY') : '')
    },
    dayClick(date) {
      if (this.selectionCount === 1) {
        this.selectionDateOne = date
        this.selectionDateTwo = null
        this.selectionCount = 2
      } else if (isBefore(date, this.selectionDateOne)) {
        if (this.maxRangeDays > 0 && differenceInDays(this.selectionDateOne,date) > this.maxRangeDays -1){
          this.selectionDateTwo = addDays(date,this.maxRangeDays-1)
        } else {
          this.selectionDateTwo = this.selectionDateOne
        }
        this.selectionDateOne = date
        this.selectionCount = 1
      } else {
        this.selectionDateTwo = date
        
        if (this.maxRangeDays > 0 && differenceInDays(date,this.selectionDateOne) > this.maxRangeDays -1){
          this.selectionDateOne = subDays(date,this.maxRangeDays-1)
        }
        this.selectionCount = 1
      }
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
        "datepicker__day--selected": isSameDay(date, this.selectionDateOne) || isSameDay(date, this.selectionDateTwo),
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
        null: getDay(date)
      }
    },
    getDateFromString(string) {
      let dateArr = string.split("-").map(el => Number(el))
      return new Date(dateArr[2], dateArr[0] - 1, dateArr[1])
    },
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
      return format(this.selectionDateOne,'MM-DD-YYYY')
    },
    computedDateTwoString(){
      return format(this.selectionDateTwo,'MM-DD-YYYY')
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
      for (let date = subMonths(this.panelDate,1) ; !isSameDay(date,addMonths(this.panelDate,3)) ; date = addMonths(date,1)) {
        calendar.push(this.buildMonth(date))
      }
      return calendar
    }
  }
}
</script>

<style lang="sass" scoped>
::-webkit-scrollbar
  width: 5px

::-webkit-scrollbar-track 
  background: #f1f1f1

::-webkit-scrollbar-thumb
  background: #888

::-webkit-scrollbar-thumb:hover
  background: #555

.datepicker__btn
  color: #808080
  transition: none
  &:hover, &:focus
    background-color: #e6e6e6
    color: #808080

.datepicker__container
  position: relative

.datepicker
  font-size: 12px
  border: 1px solid #e6e6e6
  max-width: 300px
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
  max-width: 600px

.datepicker__content
  position: relative
  overflow: hidden

.datepicker__month-container
  display: flex
  transform: translate(-300px,0)

.datepicker--move-right, .datepicker--move-left
  transition: transform 0.3s ease-in-out

.datepicker--move-right
  transform: translate(-600px,0)

.datepicker--move-left
  transform: translate(0,0)

.datepicker__month
  min-width: 300px
  padding: 15px
  flex: 0

.datepicker__month__name
  display: block
  text-align: center
  padding-bottom: 20px
  padding-top: 10px
  cursor: pointer
  span
    color: #808080
    font-size: 18px
    font-weight: 700

.datepicker__month__weekdays
  display: flex
  justify-content: space-between
  margin-bottom: 10px
  font-weight: 500

.datepicker__day-title
  flex: 1
  text-align: center

.datepicker__month__calendar
  display: flex
  flex-wrap: wrap
  align-content: flex-start
  height: 228px

.datepicker__day
  flex: 0 0 14.2857%
  height: 38px
  border: 1px solid #e6e6e6
  border-left: none
  border-top: none
  &:nth-child(7n+1):not(.datepicker__day--null)
    border-left: 1px solid #e6e6e6
  @for $i from 1 through 7
    &:nth-child(#{$i}):not(.datepicker__day--null)
      border-top: 1px solid #e6e6e6

.datepicker__day--last-null
  border-right: 1px solid #e6e6e6 !important
  border-top: none

.datepicker__day--null
  border-left: none
  pointer-events: none
  border-right: none
  border-top: none
  span
    opacity: 0

.datepicker__day--today
  font-weight: 700
  background-color: #fafafa


.datepicker__day--in-range
  background-color: #f2f2f2
  color: #666666

.datepicker__day--selected,
  background-color: #999999
  color: white
  &:focus
    background-color: #999999
    color: white

.datepicker__day--disabled
  color: #dadada
  background-color: #fbfbfb
  pointer-events: none

.datepicker__controls

.datepicker__controls__prev, .datepicker__controls__next
  width: 35px
  height: 35px
  border: 1px solid #e6e6e6
  color: #808080
  position: absolute
  top: 15px

.datepicker__controls__prev
  left: 15px

.datepicker__controls__next
  right: 15px

.datepicker__monthpicker
  position: absolute
  top: 0
  bottom: 0
  background-color: #fff
  display: flex
  flex-direction: column
  justify-content: center

.datepicker__monthpicker__header
  display: flex
  justify-content: center


.datepicker__monthpicker__year
  @extend .datepicker__month__name
  padding-top: 0
  padding-bottom: 20px
  span
    font-size: 22px

.datepicker__monthpicker__content
  display: flex
  flex-wrap: wrap
  .datepicker__btn
    flex: 0 0 33.3333%
    padding: 20px 10px
    border-left: 1px solid #e6e6e6
    border-bottom: 1px solid #e6e6e6

    &:nth-child(3n+1)
      border-left: none
    @for $i from 1 through 3
      &:nth-child(#{$i})
        border-top: 1px solid #e6e6e6

.datepicker__yearpicker
  @extend .datepicker__monthpicker
  justify-content: flex-start
  overflow: hidden
  overflow-y: auto

.datepicker__yearpicker__content
  display: flex
  flex-wrap: wrap
  .datepicker__btn
    flex: 0 0 25%
    padding: 20px 0
    border-left: 1px solid #e6e6e6
    border-bottom: 1px solid #e6e6e6

    &:nth-child(4n+1)
      border-left: none
    
.datepicker__footer
  display: flex
  justify-content: space-between
  padding: 0 15px 15px

@media screen and (max-width: 450px)
  .datepicker
    max-width: initial
    position: fixed
    right: 0
    bottom: 0
  
  .datepicker__month-container
    transform: translate(-100%,0)

  .datepicker--move-right
    transform: translate(-200%,0)

  .datepicker--move-left
    transform: translate(0,0)

  .datepicker__month
    min-width: 100%

</style>
