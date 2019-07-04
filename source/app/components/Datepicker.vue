<template lang="pug">
.datepicker(
  :class="{'datepicker--two-panels' : monthsToShow === 2}"
)

  .datepicker__content

    .datepicker__month-container(
      :class="{'datepicker__month-container--transition' : offset !== null}"
      :style="{transform : 'translate('+computedOffset+'px,0)'}"
    )
      .datepicker__month(v-for="month in calendar")
        .datepicker__month__name
          span {{months[month.month]}} {{month.year}}
        .datepicker__month__weekdays
          .datepicker__day-title(v-for="day in days") {{day}}

        .datepicker__month__calendar
          button.datepicker__day.datepicker__btn(
            v-for="day in month.days"
            :class="dayStyles(day.date,day.number)",
            @click="dayClick(day.date)"
          ) 
            span {{day.number}}

    .datepicker__controls
      button.datepicker__controls__prev.datepicker__btn(@click="offset--") <
      button.datepicker__controls__next.datepicker__btn(@click="offset++") >

  .datepicker__footer
    //- span {{computedMinDate}}

</template>

<script>
const differenceInCalendarMonths = require("date-fns/difference_in_calendar_months")
const getYear = require("date-fns/get_year")
const getDay = require("date-fns/get_day")
const getDaysInMonth = require("date-fns/get_days_in_month")
const isSameDay = require("date-fns/is_same_day")
const isWithinRange = require("date-fns/is_within_range")
const isDate = require("date-fns/is_date")
const isBefore = require("date-fns/is_before")
const isAfter = require("date-fns/is_after")
const addMonths = require("date-fns/add_months")
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
      default: 10
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
    maxRangeDays: [String, Number],
    open: Boolean
  },
  data() {
    return {
      today: null,
      months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      selectionCount: 1,
      offset: null
    }
  },
  mounted() {
    this.today = new Date()
  },
  methods: {
    dayClick(date) {
      if (this.selectionCount === 1) {
        this.$emit('update:dateOne', format(date, "MM-DD-YYYY"))
        this.$emit('update:dateTwo', '')
        this.selectionCount = 2
      } else if (isBefore(date, this.computedDateOne)) {
        this.$emit('update:dateTwo', this.dateOne)
        this.$emit('update:dateOne', format(date, "MM-DD-YYYY"))
        this.selectionCount = 1
      } else {
        this.$emit('update:dateTwo', format(date, "MM-DD-YYYY"))
        this.selectionCount = 1
      }
    },
    dayStyles(date, day) {
      const isBeforeMinDay = this.computedMinDate
        ? isBefore(date, this.computedMinDate) || isSameDay(date, this.computedMinDate)
        : false
      const isAfterMaxDay = this.computedMaxDate
        ? isAfter(date, this.computedMaxDate) || isSameDay(date, this.computedMaxDate)
        : false
      const isDisabledDay = this.disabledDays.length
        ? this.disabledDays.some(val => isSameDay(date, this.getDateFromString(val)))
        : false
      return {
        "datepicker__day--null": day <= 0,
        "datepicker__day--last-null": day < 0,
        "datepicker__day--today": isSameDay(date, this.today),
        "datepicker__day--selected": isSameDay(date, this.computedDateOne) || isSameDay(date, this.computedDateTwo),
        "datepicker__day--in-range": isDate(this.computedDateTwo)
          ? isWithinRange(date, this.computedDateOne, this.computedDateTwo)
          : false,
        "datepicker__day--disabled": isBeforeMinDay || isAfterMaxDay || isDisabledDay
      }
    },
    buildMonth(year, month) {
      let days = []
      const firstDay = new Date(year, month, 1)
      //null days of the month
      let firstWeekDay = getDay(firstDay)
      for (let nullDay = 0; nullDay < firstWeekDay; nullDay++) {
        days.push({
          number: nullDay === firstWeekDay - 1 ? -1 : 0
        })
      }
      // normal days of the month
      for (let day = 1; day <= getDaysInMonth(firstDay); day++) {
        days.push({
          number: day,
          date: new Date(year, month, day)
        })
      }
      return {
        year: year,
        month: month,
        days: days
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
    computedOffset() {
      // set the offset in the curren month
      if (this.offset === null && this.calendar.length) {
        this.offset = this.calendar.findIndex(calMonth => {
          return (calMonth.year === getYear(this.today) && calMonth.month === getMonth(this.today))
        })
      }
      if (this.offset < 0) 
        this.offset = 0
      else if (this.offset === this.calendar.length)
        this.offset = this.calendar.length - 1
      else if ( this.monthsToShow === 2 && this.offset === this.calendar.length - 1)
        this.offset = this.calendar.length - 2
      return this.offset * 300 * -1
    },
    calendar() {
      if (!this.today) return []

      let minDate = subMonths(this.today, Number(this.monthsForSelect))
      let maxDate = addMonths(this.today, Number(this.monthsForSelect))

      // if minDate < than propMinDate set it to propMinDate
      if (this.computedMinDate && isBefore(this.computedMinDate, minDate)) {
        minDate = this.computedMinDate
      }
      // if maxDate > than propMaxDate set it to propMinDate
      if (this.computedMaxDate && isAfter(this.computedMaxDate, maxDate)) {
        maxDate = this.computedMaxDate
      }

      let calendarObj = []

      for (let i = 0; i <= differenceInCalendarMonths(maxDate, minDate); i++) {
        let pDate = addMonths(minDate, i)
        calendarObj.push(this.buildMonth(getYear(pDate), getMonth(pDate)))
      }
      return calendarObj
    }
  }
}
</script>

<style lang="sass">
body
  padding: 50px 


.datepicker__btn
  color: #808080
  padding: 0
  background-color: transparent
  
  &:hover, &:focus
    background-color: #e6e6e6
    color: #808080
    outline: none

  


.datepicker
  font-size: 12px
  border: 1px solid #e6e6e6
  max-width: 300px

.datepicker--two-panels
  max-width: 600px

.datepicker__content
  position: relative
  overflow: hidden

.datepicker__month-container
  display: flex

.datepicker__month-container--transition
  transition: transform 0.2s ease-in-out

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
  &:nth-child(7n+1):not(.datepicker__day--null-day)
    border-left: 1px solid #e6e6e6
  @for $i from 1 through 7
    &:nth-child(#{$i}):not(.datepicker__day--null-day)
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
  background-color: transparent
  color: #808080
  padding: 0
  position: absolute
  top: 15px

.datepicker__controls__prev
  left: 15px

.datepicker__controls__next
  right: 15px

</style>
