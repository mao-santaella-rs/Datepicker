<template lang="pug">
.datepicker__container
  .datepicker(
    ref="datepicker"
    :class="{'datepicker--open' : open, 'datepicker--block' : block}"
  )
    .datepicker__responsive-header
      span {{dates.dateOne.string}} - {{dates.dateTwo.string}}
    .datepicker__content(
      :class="{'datepicker--two-panels' : monthsToShow === 2}"
    )
      .datepicker__daypicker
        .datepicker__daypicker__container(
          ref="daypicker_container"
          :class="{'datepicker--move-left' : dayPickerMove === 'left','datepicker--move-right' : dayPickerMove === 'right'}"
        )
          .datepicker__daypicker__panel(
            v-for="month in calendar"
            :key="`month-${month.month}-${month.year}`"
          )
            a.datepicker__daypicker__monthyear(
              @click="openMonthpicker(month.year,month.month)"
            )
              span {{months[month.month]}} {{month.year}}

            .datepicker__daypicker__weekdays
              .datepicker__daypicker__weekday(
                v-for="day in days"
                :key="`weekday-${day}`"
              ) {{day}}

            .datepicker__daypicker__calendar
              .datepicker__daypicker__day--null(
                v-for="nullDay in month.null"
              )
              button.datepicker__daypicker__day(
                v-for="day in month.days"
                :class="dayStyles(day.date)",
                @click="dayClick(day.date)"
                @mouseover="selectionCount == 2 ? dayHover(day.date) : false"
                :key="`day-${month.month}-${day.number}-${month.year}`"
              ) 
                span {{day.number}}

        button.datepicker__controls__prev(@click="daypickerMoveClick('left')")
        button.datepicker__controls__next(@click="daypickerMoveClick('right')")
    
        .datepicker__footer(:class="{'datepicker__footer--justtify-center' : block}")
          button.datepicker__cancel-btn(
            v-if="!block"
            @click="cancelClick"
          ) Cancel
          button.datepicker__cancel-btn(@click="todayClick") Today
          button.datepicker__apply-btn(
            v-if="!block"
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
                @click="openYearpicker(year)"
              )
                span {{year}}

            .datepicker__monthpicker__content
              button.datepicker__monthpicker__month(
                v-for="(month,index) in monthsShort"
                @click="monthClick(year,index)"
                :class="monthStyles(year,index)"
                :key="`month-${month}`"
              )
                span {{month}}
                .datepicker__monthpicker__dateone(
                  v-if="index === dates.dateOne.month && year === dates.dateOne.year"
                )
                  span Start: {{dates.dateOne.string}}

                .datepicker__monthpicker__datetwo(
                  v-if="index === dates.dateTwo.month && year === dates.dateTwo.year"
                )
                  span End: {{dates.dateTwo.string}}
        
        button.datepicker__controls__prev(@click="monthPickerMoveClick('left')")
        button.datepicker__controls__next(@click="monthPickerMoveClick('right')")
    
        .datepicker__footer.datepicker__footer--justtify-center
          button.datepicker__cancel-btn(@click="todayClick") Today

      .datepicker__yearpicker(
        :class="{'datepicker__yearpicker--open' : yearPickerOpen}"
      )
        .datepicker__yearpicker__container(
          ref="yearpicker_container"
          :class="{'datepicker--move-left' : yearpickerMove === 'left','datepicker--move-right' : yearpickerMove === 'right'}"
        )
          .datepicker__yearpicker__panel(
            v-for="decade in yearList"
          )

            .datepicker__yearpicker__content
              button.datepicker__yearpicker__year(
                v-for="num in 20"
                :class="yearStyles(decade + num -1)"
                @click="yearClick(decade + num -1)"
                :key="`year-${decade + num -1}`"
              ) 
                span {{decade + num -1}}
                .datepicker__yearpicker__dateone(
                  v-if="(decade + num -1) === dates.dateOne.year"
                )
                  span Start: {{dates.dateOne.string}}
                .datepicker__yearpicker__datetwo(
                  v-if="(decade + num -1) === dates.dateTwo.year"
                )
                  span End: {{dates.dateTwo.string}}

        button.datepicker__controls__prev(@click="yearPickerMoveClick('left')")
        button.datepicker__controls__next(@click="yearPickerMoveClick('right')")
    
        .datepicker__footer.datepicker__footer--justtify-center
          button.datepicker__cancel-btn(@click="todayClick") Today

</template>

<script>
import {
  differenceInDays,
  getYear,
  getDay,
  getDaysInMonth,
  isSameDay,
  isWithinInterval,
  isDate,
  isBefore,
  isAfter,
  addDays,
  addMonths,
  addYears,
  subDays,
  subMonths,
  subYears,
  getMonth,
  format
} from 'date-fns'

export default {
  name: 'Datepicker',
  props: {
    open: {
      type: Boolean,
      default: false
    },
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
    block: Boolean
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
      hoverDateOne: null,
      hoverDateTwo: null,
      dayPickerMove: '',
      dayPickerPanelDate: null,
      monthPickerOpen: false,
      monthPickerMove: '',
      monthPickerPanelDate: null,
      monthPickerCurrentMonth: null,
      yearPickerOpen: false,
      yearpickerMove: '',
      yearPickerPanelYear: null,
      yearPickerCurrentMonth: null,
      walls: {
        min: new Date(1890,0),
        max: new Date(2150,0)
      }
    }
  },
  watch:{
    open(val) {
      this.openDatepickerActions(val)
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
    this.todayClick()
    this.openDatepickerActions(this.block)    
  },
  beforeDestroy() {
    // remove all listeners
    this.removeAllListeners()
  },
  methods: {
    // @CLICK METHODS
    applyClick() {
      this.close()
    },
    cancelClick() {
      // revert the changes
      this.updatePropDates(this.initialDateOne, this.initialDateTwo)
      this.close()
    },
    outsideClick(event) {
      if (this.$refs.datepicker.contains(event.target)) return

      if (this.selectionCount === 2) {
        this.updatePropDates(this.initialDateOne, this.initialDateTwo)
        this.selectionCount = 1
      }
      this.close()
    },
    daypickerMoveClick(dir) {
      if (dir === 'left') {
        if (this.dates.minDate.date) {
          if (isBefore(this.dayPickerPanelDate,this.dates.minDate.date)) return
        } else if (isSameDay(this.walls.min,this.dayPickerPanelDate)) return
      } else if (dir === 'right') {
        if (this.dates.maxDate.date) {
          if (isAfter(addMonths(this.dayPickerPanelDate,1),this.dates.maxDate.date)) return
        } else if (isAfter(addMonths(this.dayPickerPanelDate,2), this.walls.max)) return
      }
      this.dayPickerMove = dir
    },
    todayClick(){
      this.monthPickerOpen = false
      this.yearPickerOpen = false
      // create the current calendar and monthpicker panel date
      this.dayPickerPanelDate = new Date(this.dates.today.year, this.dates.today.month)
      this.monthPickerPanelDate = this.dayPickerPanelDate
      // get the closest decade minus 10
      this.yearPickerPanelYear = Math.round(this.dates.today.year / 10) *10 -10
    },


    // DAYS METHODS
    dayClick(date) {
      if (this.selectionCount === 1) {
        this.selectionDateOne = date
        this.selectionDateTwo = null
        this.selectionCount = 2
      }
      // if the second selection is before the first
      else {
        if (isBefore(date, this.selectionDateOne)) {
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
        this.hoverDateOne = undefined
        this.hoverDateTwo = undefined
      }
      // stream the dates
      this.updatePropDates(this.selectionDateOne, this.selectionDateTwo)
    },
    dayHover(date){
      if(isBefore(date, this.selectionDateOne)){
        this.hoverDateOne = date
        this.hoverDateTwo = this.selectionDateOne
      } else {
        this.hoverDateOne = this.selectionDateOne
        this.hoverDateTwo = date
      }
    },
    dayStyles(date) {
      const isBeforeMinDay = this.dates.minDate.date 
        ? isBefore(date, this.dates.minDate.date) 
        : false
      const isBeforeMinWall = isBefore(date,this.walls.min)
      const isAfterMaxDay = this.dates.maxDate.date 
        ? isAfter(date, this.dates.maxDate.date) 
        : false
      const isAfterMaxWall = isAfter(date,this.walls.max)
      const isDisabledDay = this.disabledDays.length
        ? this.disabledDays.some((val) => isSameDay(date, this.getDateFromString(val)))
        : false

      const dayOneIsHover = this.hoverDateOne
        ? isSameDay(date, this.hoverDateOne)
        : false
      const dayOneIsSelected = this.selectionDateOne 
        ? isSameDay(date, this.selectionDateOne)
        : false

      const dayTwoIsHover = this.hoverDateTwo
        ? isSameDay(date, this.hoverDateTwo)
        : false
      const dayTwoIsSelected = this.selectionDateTwo 
        ? isSameDay(date, this.selectionDateTwo)
        : false

      return {
        'datepicker__daypicker__day--today': isSameDay(date, this.today),
        'datepicker__daypicker__day--dateone': dayOneIsHover || dayOneIsSelected,
        'datepicker__daypicker__day--datetwo': dayTwoIsHover || dayTwoIsSelected,
        'datepicker__daypicker__day--in-range': isDate(this.selectionDateTwo)
          ? isWithinInterval(date, { start: this.selectionDateOne, end: this.selectionDateTwo})
          : isDate(this.hoverDateTwo)
            ? isWithinInterval(date, { start: this.hoverDateOne, end: this.hoverDateTwo})
            : false,
        'datepicker__daypicker__day--disabled': isBeforeMinDay || isAfterMaxDay || isDisabledDay || isBeforeMinWall || isAfterMaxWall 
      }
    },

    // MONTH METHODS
    openMonthpicker(year,month){
      this.monthPickerPanelDate = new Date(year,month)
      this.monthPickerCurrentMonth = new Date(year,month)
      this.monthPickerOpen = true
    },
    monthClick(year,month) {
      this.monthPickerOpen = false
      this.dayPickerPanelDate = new Date(year,month)
    },
    monthPickerMoveClick(dir) {
      const monthPickerPanelBeginning = new Date(this.dates.monthPickerPanel.year,0)
      if (dir === 'left') {
        if (this.dates.minDate.date) {
          if (isBefore(this.monthPickerPanelDate,this.dates.minDate.date)) return
        } else if (isSameDay(monthPickerPanelBeginning,this.walls.min)) return
      } else if (dir === 'right') {
        if (this.dates.maxDate.date) {
          if (isAfter(addMonths(this.monthPickerPanelDate,1),this.dates.maxDate.date)) return
        } else if (isAfter(addMonths(monthPickerPanelBeginning,1),this.walls.max)) return
      }
      this.monthPickerMove = dir
    },
    monthStyles(year,month){
      const monthDate = new Date(year,month)
      const lastDayMonthDate = addDays(monthDate,getDaysInMonth(monthDate)-1)
      
      const isBeforeMinDay = this.dates.minDate.date ? isBefore(lastDayMonthDate, this.dates.minDate.date) : false
      const isBeforeMinWall = isBefore(monthDate,this.walls.min)
      const isAfterMaxDay = this.dates.maxDate.date ? isAfter(monthDate, this.dates.maxDate.date) : false
      const isAfterMaxWall = isAfter(monthDate,this.walls.max)
      
      return {
        'datepicker__monthpicker__month--current' : isSameDay(monthDate,this.monthPickerCurrentMonth),
        'datepicker__monthpicker__month--disabled' : isBeforeMinDay || isAfterMaxDay || isBeforeMinWall || isAfterMaxWall
      }
    },

    // YEAR METHODS
    openYearpicker(year){
      this.yearPickerCurrentMonth = year
      this.yearPickerOpen = true
    },
    yearClick(year) {
      this.monthPickerPanelDate = new Date(year,0)
      this.yearPickerOpen = false
    },
    yearPickerMoveClick(dir) {
      if (dir === 'left') {
        if(this.dates.minDate.date) {
          if (this.dates.minDate.year > this.yearPickerPanelYear) return
        } else if (this.dates.walls.min.year >= this.yearPickerPanelYear) return
      } else if (dir === 'right') {
        if (this.dates.maxDate.date){
          if (this.dates.maxDate.year < this.yearPickerPanelYear +20) return
        } else if (this.dates.walls.max.year <= this.yearPickerPanelYear +20) return
      }
      this.yearpickerMove = dir
    },
    yearStyles(year){
      const isBeforeMinDay = this.dates.minDate.date ? year < this.dates.minDate.year : false
      const isBeforeMinWall = year < getYear(this.walls.min)
      const isAfterMaxDay = this.dates.maxDate.date ? year > this.dates.maxDate.year : false
      const isAfterMaxWall = year > getYear(this.walls.max)
      return {
        'datepicker__yearpicker__year--current' : year === this.yearPickerCurrentMonth,
        'datepicker__yearpicker__year--disabled' : isBeforeMinDay || isAfterMaxDay || isBeforeMinWall || isAfterMaxWall
      }
    },

    // HELPER METHODS
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
    updatePropDates(dateOne, dateTwo) {
      this.$emit('update:dateOne', dateOne ? format(dateOne, 'MM-dd-yyyy') : '')
      this.$emit('update:dateTwo', dateTwo ? format(dateTwo, 'MM-dd-yyyy') : '')
    },
    getDateFromString(string) {
      let dateArr = string.split('-').map((el) => Number(el))
      return new Date(dateArr[2], dateArr[0] - 1, dateArr[1])
    },
    removeAllListeners(){
      this.$refs.daypicker_container.removeEventListener(this.whichTransitionEvent(), this.afterDaypickerTransition)
      this.$refs.monthpicker_container.removeEventListener(this.whichTransitionEvent(), this.afterMonthpickerTransition)
      this.$refs.yearpicker_container.removeEventListener(this.whichTransitionEvent(), this.afterYearpickerTransition)
      document.removeEventListener('mousedown', this.outsideClick)
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
        if (this.$refs.daypicker_container.style[t] !== undefined) {
          return transitions[t]
        }
      }
    },
    openDatepickerActions(val){
      if (val) {
        // load the dates from the props to the internal selection
        this.selectionDateOne = this.dateOne !== '' ? this.getDateFromString(this.dateOne) : ''
        this.initialDateOne = this.selectionDateOne
        this.selectionDateTwo = this.dateTwo !== '' ? this.getDateFromString(this.dateTwo) : ''
        this.initialDateTwo = this.selectionDateTwo
        // event listener for the timing on the slide transition
        this.$refs.daypicker_container.addEventListener(this.whichTransitionEvent(), this.afterDaypickerTransition)
        // event listener to detect a click outside of the component
        if (!this.block) document.addEventListener('mousedown', this.outsideClick)
      } else {
        this.monthPickerOpen = false
        this.yearPickerOpen = false
        this.removeAllListeners()
      }
    },
    // after the transition end the computed calendar will update
    afterDaypickerTransition(event) {
      if (event.propertyName !== 'transform') return
      
      if (this.dayPickerMove === 'left') {
        this.dayPickerPanelDate = subMonths(this.dayPickerPanelDate, 1)
      } else if (this.dayPickerMove === 'right') {
        this.dayPickerPanelDate = addMonths(this.dayPickerPanelDate, 1)
      }
      this.dayPickerMove = ''
    },
    afterMonthpickerTransition(event){
      if (event.propertyName !== 'transform') return
      if (this.monthPickerMove === 'left') {
        this.monthPickerPanelDate = subYears(this.monthPickerPanelDate, 1)
      } else if (this.monthPickerMove === 'right') {
        this.monthPickerPanelDate = addYears(this.monthPickerPanelDate, 1)
      }
      this.monthPickerMove = ''
    },
    afterYearpickerTransition(){
      if (this.yearpickerMove === 'left') {
        this.yearPickerPanelYear -= 20
      } else if (this.yearpickerMove === 'right') {
        this.yearPickerPanelYear += 20
      }
      this.yearpickerMove = ''
    },
    close() {
      this.$emit('update:open', false)
      this.monthPickerOpen = false
      this.yearPickerOpen = false
      this.hoverDateOne = undefined
      this.hoverDateTwo = undefined
    },
  },
  computed: {
    dates() {      
      return {
        today:{
          year: getYear(this.today),
          month: getMonth(this.today)
        },
        dateOne: {
          year: this.selectionDateOne 
            ? getYear(this.selectionDateOne)
            : this.dateOne 
              ? getYear(this.getDateFromString(this.dateOne)) 
              : false,
          month: this.selectionDateOne
            ? getMonth(this.selectionDateOne)
            : this.dateOne 
              ? getMonth(this.getDateFromString(this.dateOne)) 
              : false,
          string: this.selectionDateOne 
            ? format(this.selectionDateOne, 'MM-dd-yyyy') 
            : 'mm-dd-yyyy'
        },
        dateTwo: {
          year: this.selectionDateTwo
            ? getYear(this.selectionDateTwo)
            : this.dateTwo 
              ? getYear(this.getDateFromString(this.dateTwo)) 
              : false,
          month: this.selectionDateTwo
            ? getMonth(this.selectionDateTwo)
            : this.dateTwo 
              ? getMonth(this.getDateFromString(this.dateTwo)) 
              : false,
          string: this.selectionDateTwo 
            ? format(this.selectionDateTwo, 'MM-dd-yyyy') 
            : 'mm-dd-yyyy'
        },
        dayPickerPanel:{
          year: getYear(this.dayPickerPanelDate),
          month: getMonth(this.dayPickerPanelDate)
        },
        monthPickerPanel:{
          year: getYear(this.monthPickerPanelDate),
          month: getMonth(this.monthPickerPanelDate)
        },
        minDate: this.minDate != ''
          ? {
            year: getYear(this.getDateFromString(this.minDate)),
            date: this.getDateFromString(this.minDate)
          }
          : false,
        maxDate: this.maxDate != ''
          ? {
            year: getYear(this.getDateFromString(this.maxDate)),
            date: this.getDateFromString(this.maxDate)
          }
          : false,
        walls: {
          min:{
            year: getYear(this.walls.min),
            month: getMonth(this.walls.min)
          },
          max:{
            year: getYear(this.walls.max),
            month: getMonth(this.walls.max)
          }
        }
      }
    },
    yearList(){
      return [
        this.yearPickerPanelYear -20,
        this.yearPickerPanelYear,
        this.yearPickerPanelYear +20,
        this.yearPickerPanelYear +40
      ]
    },
    calendar() {
      if (!this.today) return []
      let calendar = []
      // it will load 4 months everi time it updates one before and one after for the transition and the extra for the 2 panel view
      for (
        let date = subMonths(this.dayPickerPanelDate, 1);
        !isSameDay(date, addMonths(this.dayPickerPanelDate, 3));
        date = addMonths(date, 1)
      ) {
        calendar.push(this.buildMonth(date))
      }
      return calendar
    },
    monthPickerObj(){
      let yearL = []
      for (
        let year = this.dates.monthPickerPanel.year -1; 
        year <= this.dates.monthPickerPanel.year +2; 
        year++
      ) {
        yearL.push(year)
      }
      return yearL
    }
  }
}
</script>

<style lang="sass" scoped>
@import url('https://fonts.googleapis.com/css?family=Oswald:300,400,700&display=swap')
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
  background-color: #fff
  position: absolute
  top: 0
  left: 0
  opacity: 0
  pointer-events: none
  transition: opacity 0.2s ease-in-out
  font-family: 'Oswald', sans-serif

.datepicker--open
  opacity: 1
  pointer-events: initial
  z-index: 10000

.datepicker--block
  @extend .datepicker--open
  width: fit-content
  position: relative
  z-index: auto

.datepicker__responsive-header
  display: none
  justify-content: center
  padding-top: 30px

  span
    font-size: 17px
    color: $color-gray

.datepicker__content
  max-width: $component-width
  position: relative
  overflow: hidden

.datepicker--two-panels
  max-width: calc(#{$component-width} * 2)



.datepicker__daypicker

.datepicker__daypicker__container
  display: flex
  transform: translate(-#{$component-width},0)

.datepicker--move-right, .datepicker--move-left
  transition: transform 0.3s ease-in-out

.datepicker--move-right
  transform: translate(-#{$component-width *2},0)

.datepicker--move-left
  transform: translate(0,0)

.datepicker__daypicker__panel
  min-width: $component-width
  padding: 30px 30px 15px
  flex: 0

.datepicker__daypicker__monthyear
  display: block
  text-align: center
  padding-bottom: 25px
  cursor: pointer
  span
    color: $color-dark-gray
    font-size: 20px

.datepicker__daypicker__weekdays
  display: flex
  justify-content: space-between
  margin-bottom: 10px
  color: $color-gray
  opacity: .7

.datepicker__daypicker__weekday
  flex: 1
  text-align: center
  font-weight: 300

.datepicker__daypicker__calendar
  display: flex
  flex-wrap: wrap
  align-content: flex-start
  height: calc(#{$day-width} *6)

.datepicker__daypicker__day
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
  &:after, &:before
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
  &:before
    background-color: $color-black
    border: none

  span
    position: relative
    line-height: 1em

.datepicker__daypicker__day--null
  @extend .datepicker__daypicker__day
  pointer-events: none
  opacity: 0

.datepicker__daypicker__day--today
  font-weight: 700
  &:before
    opacity: 0.04



.datepicker__daypicker__day--in-range
  background-color: $color-light-gray

.datepicker__daypicker__day--dateone,
.datepicker__daypicker__day--datetwo
  color: #fff
  &:before
    opacity: 1
  &:hover, &:focus
    color: #fff

.datepicker__daypicker__day--dateone
  border-radius: calc(#{$day-width} /2) 0 0 calc(#{$day-width} /2)

.datepicker__daypicker__day--datetwo
  border-radius: 0 calc(#{$day-width} /2) calc(#{$day-width} /2) 0

.datepicker__daypicker__day--disabled
  opacity: 0.3
  pointer-events: none



.datepicker__controls__prev,
.datepicker__controls__next
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

.datepicker__footer--justtify-center
  justify-content: center

.datepicker__apply-btn, 
.datepicker__cancel-btn
  font-size: 14px

.datepicker__cancel-btn
  color: $color-gray

.datepicker__apply-btn--disabled
  @extend .datepicker__daypicker__day--disabled



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

  .datepicker__footer
    padding: 0

.datepicker__monthpicker--open
  opacity: 1
  pointer-events: auto

.datepicker__monthpicker__container
  @extend .datepicker__daypicker__container

.datepicker__monthpicker__panel
  @extend .datepicker__daypicker__panel
  padding-bottom: 30px

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
    .datepicker__monthpicker__dateone,
    .datepicker__monthpicker__datetwo
      span
        opacity: 1

.datepicker__monthpicker__dateone,
.datepicker__monthpicker__datetwo
  left: 50%
  position: absolute
  pointer-events: none
  transform: translate(-50%,0)
  z-index: 1001

  &:before
    content: ''
    display: block
    height: 5px
    width: 5px
    border-radius: 50%
    background-color: $color-black
    position: absolute
    left: 50%
    top: 50%
    transform: translate(-50%,-50%)

  span
    display: block
    font-size: 0.6rem
    color: white
    padding: 3px 5px
    background-color: $color-gray
    white-space: nowrap
    opacity: 0
    position: relative

.datepicker__monthpicker__dateone
  top: 0
  span
    transform: translate(0,-50%)

.datepicker__monthpicker__datetwo
  bottom: 0
  span
    transform: translate(0,50%)

.datepicker__monthpicker__month--current
  background-color: $color-light-gray

.datepicker__monthpicker__year
  @extend .datepicker__daypicker__monthyear
  padding-top: 0
  padding-bottom: 20px
  span
    font-size: 22px

.datepicker__monthpicker__month--disabled
  @extend .datepicker__daypicker__day--disabled



.datepicker__yearpicker
  @extend .datepicker__monthpicker

.datepicker__yearpicker--open
  @extend .datepicker__monthpicker--open

.datepicker__yearpicker__container
  @extend .datepicker__monthpicker__container

.datepicker__yearpicker__panel
  @extend .datepicker__monthpicker__panel
  padding-top: 45px
  padding-bottom: 10px

.datepicker__yearpicker__content
  @extend .datepicker__monthpicker__content

.datepicker__yearpicker__year
  @extend .datepicker__monthpicker__month
  flex: 0 0 calc(100% /4)

.datepicker__yearpicker__year--current
  @extend .datepicker__monthpicker__month--current

.datepicker__yearpicker__dateone
  @extend .datepicker__monthpicker__dateone

.datepicker__yearpicker__datetwo
  @extend .datepicker__monthpicker__datetwo

.datepicker__yearpicker__year--disabled
  @extend .datepicker__daypicker__day--disabled



@media screen and (max-width: 750px)
  .datepicker--two-panels
    max-width: $component-width

@media screen and (max-width: 450px)
  .datepicker:not(.datepicker--block)
    max-width: initial
    position: fixed
    right: 0
    bottom: 0

  .datepicker__responsive-header
    display: flex

  .datepicker__daypicker__container
    transform: translate(-100%,0)

  .datepicker--move-right
    transform: translate(-200%,0)

  .datepicker--move-left
    transform: translate(0,0)

  .datepicker__month
    min-width: 100%
</style>
