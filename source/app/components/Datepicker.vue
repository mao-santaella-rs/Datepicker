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
        .datepicker__month(v-for="month in calendar")
          .datepicker__month__name
            span {{months[month.month]}} {{month.year}}

          .datepicker__month__weekdays
            .datepicker__day-title(v-for="day in days") {{day}}

          .datepicker__month__calendar
            .datepicker__day.datepicker__day--null(
              v-for="nullDay in month.null"
              :class="{'datepicker__day--last-null' : nullDay === month.null}"
            )
            button.datepicker__day.datepicker__btn(
              v-for="day in month.days"
              :class="dayStyles(day.date)",
              @click="dayClick(day.date)"
            ) 
              span {{day.number}}

      button.datepicker__controls__prev.datepicker__btn(@click="panelMove = 'left'") <
      button.datepicker__controls__next.datepicker__btn(@click="panelMove = 'right'") >

    .datepicker__footer

</template>

<script>
const differenceInCalendarMonths = require("date-fns/difference_in_calendar_months")
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
    monthsForSelect: {
      type: Number,
      default: 24
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
      // ['09-14-2018','09-15-2018']
      // TODO when is in between the selection?
      type: Array,
      default: () => []
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
      panelMove: '',
      panelDate: null
    }
  },
  mounted() {
    this.today = new Date()
    this.panelDate = new Date(getYear(this.today), getMonth(this.today))
    this.$refs.container.addEventListener(this.whichTransitionEvent(), this.afterTransition)
  },
  beforeDestroy() {
    this.$refs.container.removeEventListener(this.whichTransitionEvent(), this.afterTransition)
  },
  methods: {
    dayClick(date) {

      if (this.selectionCount === 1) {
        this.$emit('update:dateOne', format(date, "MM-DD-YYYY"))
        this.$emit('update:dateTwo', '')
        this.selectionCount = 2
        
      } else if (isBefore(date, this.computedDateOne)) {

        if (this.maxRangeDays > 0 && differenceInDays(this.computedDateOne,date) > this.maxRangeDays -1){
          this.$emit('update:dateTwo', format(addDays(date,this.maxRangeDays-1), "MM-DD-YYYY"))
        } else {
          this.$emit('update:dateTwo', this.dateOne)
        }

        this.$emit('update:dateOne', format(date, "MM-DD-YYYY"))
        this.selectionCount = 1
      } else {
        this.$emit('update:dateTwo', format(date, "MM-DD-YYYY"))
        
        if (this.maxRangeDays > 0 && differenceInDays(date,this.computedDateOne) > this.maxRangeDays -1){
          this.$emit('update:dateOne', format(subDays(date,this.maxRangeDays-1), "MM-DD-YYYY"))
        }

        this.selectionCount = 1
      }
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
        "datepicker__day--selected": isSameDay(date, this.computedDateOne) || isSameDay(date, this.computedDateTwo),
        "datepicker__day--in-range": isDate(this.computedDateTwo)
          ? isWithinRange(date, this.computedDateOne, this.computedDateTwo)
          : false,
        "datepicker__day--disabled": isBeforeMinDay || isAfterMaxDay || isDisabledDay
      }
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
    }
  },
  computed: {
    computedDateOne(){
      return this.dateOne != '' ? this.getDateFromString(this.dateOne) : false
    },
    computedDateTwo(){
      return this.dateTwo != '' ? this.getDateFromString(this.dateTwo) : false
    },
    computedMinDate() {
      return this.minDate != '' ? this.getDateFromString(this.minDate) : false
    },
    computedMaxDate() {
      return this.maxDate != '' ? this.getDateFromString(this.maxDate) : false
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

<style lang="sass">
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
  text-align: center
  margin-bottom: 20px
  margin-top: 10px
  span
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

</style>
