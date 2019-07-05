<template lang="pug">
	
	#app
		.container
			span {{dates.firstDate}} to {{dates.lastDate}}

		Datepicker(
			min-date="12-05-2016"
			max-date="03-25-2021"
			:date-one="dates.firstDate"
			:date-two="dates.lastDate"
			:months-to-show="panels"
			:max-range-days="10"
			@update:dateOne="val => dates.firstDate = val"
			@update:dateTwo="val => dates.lastDate = val"
		)
		a(href="#" @click="panels = panels == 1 ? 2 : 1") show 1 or 2 months

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
			panels: 1
		}
	},
	methods:{},
	computed:{},
	created(){},
	mounted(){}
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
