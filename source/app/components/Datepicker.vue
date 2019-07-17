<template lang="pug">
.datepicker__container
  .datepicker(
    ref="datepicker"
    :class="{'datepicker--open' : open,'datepicker--two-panels' : monthsToShow === 2}"
  )
    .datepicker__responsive-header
      span {{computedDateOneString}} - {{computedDateTwoString}}
    .datepicker__content
      .datepicker__calendar
        .datepicker__month-container(
          ref="calendar_container"
          :class="{'datepicker--move-left' : calendarMove === 'left','datepicker--move-right' : calendarMove === 'right'}"
        )
          .datepicker__month(
            v-for="month in calendar"
            :key="`month-${month.month}-${month.year}`"
          )
            a.datepicker__month__name(
              @click="monthPickerOpen = true"
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

        button.datepicker__controls__prev(@click="calendarMove = 'left'")
        button.datepicker__controls__next(@click="calendarMove = 'right'")
    
        .datepicker__footer
          button.datepicker__cancel-btn(@click="cancelClick") Cancel
          button.datepicker__apply-btn(
            @click="applyClick"
            :class="{ 'datepicker__apply-btn--disabled': selectionCount === 2 || initialDateOne === selectionDateOne }"
          ) Apply

      .datepicker__monthpicker(
        :class="{'datepicker__monthpicker--open' : monthPickerOpen}"
      )
        .datepicker__monthpicker__container(
          ref="monthpicker_container"
          :class="{'datepicker--move-left' : monthPickerMove === 'left','datepicker--move-right' : monthPickerMove === 'right'}"
        )
          .datepicker__monthpicker__panel(
            v-for="year in monthPickerObj"
          )
            .datepicker__monthpicker__header
              a.datepicker__monthpicker__year(
                @click="yearPickerOpen = true"
              )
                span {{year}}

            .datepicker__monthpicker__content
              button.datepicker__monthpicker__month(
                v-for="(month,index) in monthsShort"
                @click="() => monthClick(index,year)"
                :class="monthStyles(index,year)"
                :key="`month-${month}`"
              )
                span {{month}}
                span.datepicker__monthpicker__month__dateone Start: {{computedDateOneString}}
                span.datepicker__monthpicker__month__datetwo End: {{computedDateTwoString}}
        
        button.datepicker__controls__prev(@click="monthPickerMove = 'left'")
        button.datepicker__controls__next(@click="monthPickerMove = 'right'")

      .datepicker__yearpicker(
        :class="{'datepicker__yearpicker--open' : yearPickerOpen}"
      )
        .datepicker__yearpicker__container(
          ref="yearpicker_container"
          :class="{'datepicker--move-left' : yearpickerMove === 'left','datepicker--move-right' : yearpickerMove === 'right'}"
        )
          .datepicker__yearpicker__panel(
            v-for="panel in yearsList"
          )

            .datepicker__yearpicker__content
              button.datepicker__yearpicker__year(
                v-for="year in panel"
                :class="{'datepicker__day--today' : year === dates.calendarPanel.year}"
                @click="() => yearClick(year)"
                :key="`year-${year}`"
              ) {{year}}

        button.datepicker__controls__prev(@click="yearpickerMove = 'left'")
        button.datepicker__controls__next(@click="yearpickerMove = 'right'")

</template>

<script>
// date-fns imports
const differenceInDays = require('date-fns/difference_in_calendar_days')
const getYear = require('date-fns/get_year')
const getDay = require('date-fns/get_day')
const getDaysInMonth = require('date-fns/get_days_in_month')
const isSameDay = require('date-fns/is_same_day')
const isWithinRange = require('date-fns/is_within_range')
const isDate = require('date-fns/is_date')
const isBefore = require('date-fns/is_before')
const isAfter = require('date-fns/is_after')
const addDays = require('date-fns/add_days')
const addMonths = require('date-fns/add_months')
const addYears = require('date-fns/add_years')
const subDays = require('date-fns/sub_days')
const subMonths = require('date-fns/sub_months')
const subYears = require('date-fns/sub_years')
const getMonth = require('date-fns/get_month')
const format = require('date-fns/format')

export default {
  name: 'Datepicker',
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
      default: ''
    },
    maxDate: {
      type: String,
      default: ''
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
      validator: function(val) {
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
      months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
      monthsShort: ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      selectionCount: 1,
      selectionDateOne: null,
      selectionDateTwo: null,
      initialDateOne: null,
      initialDateTwo: null,
      calendarMove: '',
      calendarPanelDate: null,
      monthPickerMove: '',
      monthPickerPanelDate: null,
      monthPickerOpen: false,

      yearPickerOpen: false,
      yearpickerMove: ''
    }
  },
  watch:{
    open(val) {
      if (val) {
        // load the dates from the props to the internal selection
        this.selectionDateOne = this.dateOne !== '' ? this.getDateFromString(this.dateOne) : ''
        this.initialDateOne = this.selectionDateOne
        this.selectionDateTwo = this.dateTwo !== '' ? this.getDateFromString(this.dateTwo) : ''
        this.initialDateTwo = this.selectionDateTwo
        // event listener to detect a click outside of the component
        document.addEventListener('mousedown', this.outsideClick)
      } else {
        // add the listener when open and remove it when close
        document.removeEventListener('mousedown', this.outsideClick)
        this.monthPickerOpen = false
      }
    },
    monthPickerOpen(val){
      if (val) {
        this.$refs.monthpicker_container.addEventListener(this.whichTransitionEvent(), this.afterMonthpickerTransition)
      } else {
        this.$refs.monthpicker_container.removeEventListener(this.whichTransitionEvent(), this.afterMonthpickerTransition)
      }
    },
    yearPickerOpen(val){
      if (val) {
        this.$refs.yearpicker_container.addEventListener(this.whichTransitionEvent(), this.afterYearpickerTransition)
      } else {
        this.$refs.yearpicker_container.removeEventListener(this.whichTransitionEvent(), this.afterYearpickerTransition)
      }
    }
  },
  mounted() {
    // create the today date
    this.today = new Date()
    // create the current calendar and monthpicker panel date
    this.calendarPanelDate = new Date(this.dates.today.year, this.dates.today.month)
    this.monthPickerPanelDate = this.calendarPanelDate
    // event listener for the timing on the slide transition
    this.$refs.calendar_container.addEventListener(this.whichTransitionEvent(), this.afterCalendarTransition)
  },
  beforeDestroy() {
    // remove all listeners
    this.$refs.calendar_container.removeEventListener(this.whichTransitionEvent(), this.afterCalendarTransition)
    document.removeEventListener('mousedown', this.outsideClick)
  },
  methods: {
    applyClick() {
      this.close()
    },
    cancelClick() {
      // revert the changes
      this.updatePropDates(this.initialDateOne, this.initialDateTwo)
      this.close()
    },
    updatePropDates(dateOne, dateTwo) {
      this.$emit('update:dateOne', dateOne ? format(dateOne, 'MM-DD-YYYY') : '')
      this.$emit('update:dateTwo', dateTwo ? format(dateTwo, 'MM-DD-YYYY') : '')
    },
    outsideClick(event) {
      if (this.$refs.datepicker.contains(event.target)) return

      if (this.selectionCount === 2) {
        this.updatePropDates(this.initialDateOne, this.initialDateTwo)
        this.selectionCount = 1
      }
      this.close()
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
        if (this.maxRangeDays > 0 && differenceInDays(this.selectionDateOne, date) > this.maxRangeDays - 1) {
          this.selectionDateTwo = addDays(date, this.maxRangeDays - 1)
        } else {
          // else asign dateOne to dateTwo
          this.selectionDateTwo = this.selectionDateOne
        }
        this.selectionDateOne = date
        this.selectionCount = 1
      } else {
        this.selectionDateTwo = date

        // if with the second selection the range is greater than maxRangeDays adjust it
        if (this.maxRangeDays > 0 && differenceInDays(date, this.selectionDateOne) > this.maxRangeDays - 1) {
          this.selectionDateOne = subDays(date, this.maxRangeDays - 1)
        }
        this.selectionCount = 1
      }
      // stream the dates
      this.updatePropDates(this.selectionDateOne, this.selectionDateTwo)
    },
    dayStyles(date) {
      const isBeforeMinDay = this.computedMinDate ? isBefore(date, this.computedMinDate) : false
      const isAfterMaxDay = this.computedMaxDate ? isAfter(date, this.computedMaxDate) : false
      const isDisabledDay = this.disabledDays.length
        ? this.disabledDays.some((val) => isSameDay(date, this.getDateFromString(val)))
        : false
      return {
        'datepicker__day--today': isSameDay(date, this.today),
        'datepicker__day--selected-one': isSameDay(date, this.selectionDateOne),
        'datepicker__day--selected-two': isSameDay(date, this.selectionDateTwo),
        'datepicker__day--in-range': isDate(this.selectionDateTwo)
          ? isWithinRange(date, this.selectionDateOne, this.selectionDateTwo)
          : false,
        'datepicker__day--disabled': isBeforeMinDay || isAfterMaxDay || isDisabledDay
      }
    },
    monthClick(monthIndex,year) {
      console.log(monthIndex,year);
      this.calendarPanelDate = new Date(year, monthIndex)
      this.monthPickerOpen = false
      this.monthPickerPanelDate = this.calendarPanelDate
    },
    monthStyles(monthIndex, year){
      return {
        'datepicker__monthpicker__month--current' : monthIndex === this.dates.calendarPanel.month && year === this.dates.calendarPanel.year,
        'datepicker__monthpicker__month--dateone' : monthIndex === this.dates.dateOne.month && year === this.dates.dateOne.year,
        'datepicker__monthpicker__month--datetwo' : monthIndex === this.dates.dateTwo.month && year === this.dates.dateTwo.year
      }
    },
    yearClick(year) {
      this.calendarPanelDate = new Date(year, this.dates.calendarPanel.month)
      this.yearPickerOpen = false
    },
    buildMonth(date) {
      let year = getYear(date)
      let month = getMonth(date)
      let days = []

      for (let day = 1; day <= getDaysInMonth(date); day++) {
        days.push({
          number: day,
          date: new Date(year, month, day)
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
      let dateArr = string.split('-').map((el) => Number(el))
      return new Date(dateArr[2], dateArr[0] - 1, dateArr[1])
    },
    // this method will return a cross-browser property of the transition
    whichTransitionEvent() {
      const transitions = {
        transition: 'transitionend',
        OTransition: 'oTransitionEnd',
        MozTransition: 'transitionend',
        WebkitTransition: 'webkitTransitionEnd'
      }
      for (let t in transitions) {
        if (this.$refs.calendar_container.style[t] !== undefined) {
          return transitions[t]
        }
      }
    },
    // after the transition end the computed calendar will update
    afterCalendarTransition(event) {
      if (event.propertyName !== 'transform') return
      if (this.calendarMove === 'left') {
        this.calendarPanelDate = subMonths(this.calendarPanelDate, 1)
      } else if (this.calendarMove === 'right') {
        this.calendarPanelDate = addMonths(this.calendarPanelDate, 1)
      }
      this.calendarMove = ''
    },
    afterMonthpickerTransition(event){
      console.log("after trans");
      
      if (event.propertyName !== 'transform') return
      if (this.monthPickerMove === 'left') {
        this.monthPickerPanelDate = subYears(this.monthPickerPanelDate, 1)
      } else if (this.monthPickerMove === 'right') {
        this.monthPickerPanelDate = addYears(this.monthPickerPanelDate, 1)
      }
      this.monthPickerMove = ''
    },
    afterYearpickerTransition(event){
      console.log('after year transition');
      
    },
    close() {
      this.$emit('update:open', false)
      this.monthPickerOpen = false
      this.yearPickerOpen = false
    }
  },
  computed: {
    computedDateOneString() {
      return this.selectionDateOne ? format(this.selectionDateOne, 'MM-DD-YYYY') : 'MM-DD-YYYY'
    },
    computedDateTwoString() {
      return this.selectionDateTwo ? format(this.selectionDateTwo, 'MM-DD-YYYY') : 'MM-DD-YYYY'
    },
    computedMinDate() {
      return this.minDate != '' ? this.getDateFromString(this.minDate) : false
    },
    computedMaxDate() {
      return this.maxDate != '' ? this.getDateFromString(this.maxDate) : false
    },
    dates() {
      return {
        today:{
          year: getYear(this.today),
          month: getMonth(this.today),
          day: getDay(this.today)
        },
        dateOne: {
          year: this.dateOne ? getYear(this.dateOne) : false,
          month: this.dateOne ? getMonth(this.dateOne) : false,
          day: this.dateOne ? getDay(this.dateOne) : false
        },
        dateTwo: {
          year: this.dateTwo ? getYear(this.dateTwo) : false,
          month: this.dateTwo ? getMonth(this.dateTwo) : false,
          day: this.dateTwo ? getDay(this.dateTwo) : false
        },
        calendarPanel:{
          year: getYear(this.calendarPanelDate),
          month: getMonth(this.calendarPanelDate)
        },
        monthPickerPanel:{
          year: getYear(this.monthPickerPanelDate),
          month: getMonth(this.monthPickerPanelDate)
        },
        minDate:{
          year: this.computedMinDate ? getYear(this.computedMinDate) : false,
          month: this.computedMinDate ? getMonth(this.computedMinDate) : false,
          day: this.computedMinDate ? getDay(this.computedMinDate) : false,
        },
        maxDate:{
          year: this.computedMaxDate ? getYear(this.computedMaxDate) : false,
          month: this.computedMaxDate ? getMonth(this.computedMaxDate) : false,
          day: this.computedMaxDate ? getDay(this.computedMaxDate) : false
        }
      }
    },
    // list for the year selection
    yearsList() {
      const firstYear = this.dates.today.year - 40
      const lastYear = this.dates.today.year + 40
      let yearList = [[],[],[],[]]
      for (let year = firstYear; year <= lastYear; year++) {
        if (year < firstYear +20) {
          yearList[0].push(year)
        } else if (year >= firstYear +20 && year < firstYear +40) {
          yearList[1].push(year)
        } else if (year >= firstYear +40 && year < firstYear +60) {
          yearList[2].push(year)
        } else if (year >= firstYear +60 && year < firstYear +80) {
          yearList[3].push(year)
        }
      }
      return yearList
    },
    calendar() {
      if (!this.today) return []
      let calendar = []
      // it will load 4 months everi time it updates one before and one after for the transition and the extra for the 2 panel view
      for (
        let date = subMonths(this.calendarPanelDate, 1);
        !isSameDay(date, addMonths(this.calendarPanelDate, 3));
        date = addMonths(date, 1)
      ) {
        calendar.push(this.buildMonth(date))
      }
      return calendar
    },
    monthPickerObj(){
      let yearList = []
      for (
        let year = this.dates.monthPickerPanel.year -1; 
        year <= this.dates.monthPickerPanel.year +2; 
        year++
      ) {
        yearList.push(year)
      }
      return yearList
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
  background: transparent
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

.datepicker__responsive-header
  display: none
  justify-content: center
  padding-top: 30px

  span
    font-size: 17px
    color: $color-gray

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



.datepicker__monthpicker
  position: absolute
  top: 0
  bottom: 0
  left: 0
  right: 0
  background-color: #fff
  opacity: 0
  pointer-events: none
  transition: opacity 0.1s ease-in-out

.datepicker__monthpicker--open
  opacity: 1
  pointer-events: auto

.datepicker__monthpicker__container
  @extend .datepicker__month-container
  align-items: center
  height: 100%

.datepicker__monthpicker__panel
  min-width: $component-width
  flex: 0
  padding: 15px 30px

.datepicker__monthpicker__header
  display: flex
  justify-content: center

.datepicker__monthpicker__content
  display: flex
  flex-wrap: wrap
  
.datepicker__monthpicker__month
  flex: 0 0 calc(100% /3)
  padding: 20px 0
  border: 1px solid transparent
  position: relative

  &:hover
    border-color: $color-border

  &:before, &:after
    display: block
    height: 5px
    width: 5px
    border-radius: 50%
    background-color: $color-black
    position: absolute
    left: 50%
    transform: translate(-50%,0)

.datepicker__monthpicker__month__dateone, .datepicker__monthpicker__month__datetwo
  font-size: 0.5rem
  position: absolute
  left: 50%
  opacity: 0
  pointer-events: none
  background-color: $color-gray
  color: white
  padding: 3px 5px
  white-space: nowrap

.datepicker__monthpicker__month__dateone
  transform: translate(-50%,-100%)
  top: 5px

.datepicker__monthpicker__month__datetwo
  transform: translate(-50%,100%)
  bottom: 5px

.datepicker__monthpicker__month--current
  background-color: $color-light-gray

.datepicker__monthpicker__month--dateone
  &:hover
    .datepicker__monthpicker__month__dateone
      opacity: 1

  &:before
    content: ""
    top: 5px

.datepicker__monthpicker__month--datetwo
  &:hover
    .datepicker__monthpicker__month__datetwo
      opacity: 1
  &:after
    content: ""
    bottom: 5px

.datepicker__monthpicker__year
  @extend .datepicker__month__name
  padding-top: 0
  padding-bottom: 20px
  span
    font-size: 22px



.datepicker__yearpicker
  @extend .datepicker__monthpicker

.datepicker__yearpicker--open
  @extend .datepicker__monthpicker--open

.datepicker__yearpicker__container
  @extend .datepicker__monthpicker__container

.datepicker__yearpicker__panel
  @extend .datepicker__monthpicker__panel

.datepicker__yearpicker__content
  @extend .datepicker__monthpicker__content

.datepicker__yearpicker__year
  @extend .datepicker__monthpicker__month
  flex: 0 0 calc(100% /4)



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
