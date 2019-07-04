const	gulp							= require('gulp'),
			plumber						= require('gulp-plumber'),
			browserSync				= require('browser-sync').create(),
			webpack 					= require('webpack-stream')

const src = './source', // -> Desarrollo
			pub = './public'; // -> Producción

// VARIABLES
const carpeta = {
	vue: {
		file	: src + '/app/app.js',
		src		: src + '/app/**/*.js',
		inc		: src + '/app/**/*.vue',
		pub		: pub
	},
	html: {
		src		: src + '/index.html',
		pub		: pub
	},
	css: {
		src		: src + '/reset.css',
		pub		: pub
	}
};

const webpackConfig = require('./webpack.config.js')

// TASKS ------------------------------------------------------------------

// COMPILAR VUE WEBPACK
gulp.task('vue', done => {
	gulp.src(carpeta.vue.file)
		.pipe(plumber())
		.pipe(webpack(webpackConfig))
		.pipe(gulp.dest(carpeta.vue.pub))
		// REFRESCADO DEL NAVEGADOR
		.pipe(browserSync.stream());
	done()
});

// COMPILAR VUE PRODUCTION MODE
gulp.task('vue-final', done => {
	webpackConfig.mode = "production"
	gulp.src(carpeta.vue.file)
		.pipe(webpack(webpackConfig))
		.pipe(gulp.dest(carpeta.vue.pub))
	done()
});

// COPIA DE ARCHIVO HTML
gulp.task('html', done => {
	gulp.src(carpeta.html.src)
		.pipe(gulp.dest(carpeta.html.pub))
		// REFRESCADO DEL NAVEGADOR
		.pipe(browserSync.stream());
	done()
});

// COPIA DE ARCHIVO JSON
gulp.task('css', done => {
	gulp.src(carpeta.css.src)
		.pipe(gulp.dest(carpeta.css.pub))
		// REFRESCADO DEL NAVEGADOR
		.pipe(browserSync.stream());
	done()
});

// MONTAJE DEL SERVIDOR
gulp.task('servidor', done => {
	browserSync.init({
		server: pub,
		open: false,
		notify: false
	});
	done()
});


// WATCH
gulp.task('watch', done => {
	// VIGILA LOS ARCHIVOS .VUE DENTRO DE app
	gulp.watch(carpeta.vue.inc , gulp.series('vue'));
	// VIGILA LOS ARCHIVOS JS DENTRO DE app
	gulp.watch(carpeta.vue.src, gulp.series('vue'));
	// VIGILA LOS ARCHIVOS HTML DENTRO DE SOURCE
	gulp.watch(carpeta.html.src, gulp.series('html'));
	// VIGILA LOS ARCHIVOS CSS DENTRO DE SOURCE
	gulp.watch(carpeta.css.src, gulp.series('css'));
	done()
});

// DEFAULT
gulp.task('default', gulp.parallel('servidor', 'watch'));
