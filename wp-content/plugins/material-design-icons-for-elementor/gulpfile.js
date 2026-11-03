'use strict';

var gulp         = require( 'gulp' ),
	rename       = require( 'gulp-rename' ),
	notify       = require( 'gulp-notify' ),
	autoprefixer = require( 'gulp-autoprefixer' ),
	sass         = require( 'gulp-sass' ),
	plumber      = require( 'gulp-plumber' );

//css
gulp.task( 'css-icons', function() {
	return gulp.src( './assets/material-icons/scss/material-icons.scss' )
		.pipe(
			plumber( {
				errorHandler: function( error ) {
					console.log( '=================ERROR=================' );
					console.log( error.message );
					this.emit( 'end' );
				}
			} )
		)
		.pipe( sass( { outputStyle: 'compressed' } ) )
		.pipe( autoprefixer( {
			browsers: ['last 10 versions'],
			cascade:  false
		} ) )

		.pipe( rename( 'material-icons.css' ) )
		.pipe( gulp.dest( './assets/material-icons/css/' ) )
		.pipe( notify( 'Compile Sass Done!' ) );
} );

gulp.task( 'css-icons-regular', function() {
	return gulp.src( './assets/material-icons/scss/material-icons-regular.scss' )
		.pipe(
			plumber( {
				errorHandler: function( error ) {
					console.log( '=================ERROR=================' );
					console.log( error.message );
					this.emit( 'end' );
				}
			} )
		)
		.pipe( sass( { outputStyle: 'compressed' } ) )
		.pipe( autoprefixer( {
			browsers: ['last 10 versions'],
			cascade:  false
		} ) )

		.pipe( rename( 'material-icons-regular.css' ) )
		.pipe( gulp.dest( './assets/material-icons/css/' ) )
		.pipe( notify( 'Compile Sass Done!' ) );
} );

gulp.task( 'css-icons-outlined', function() {
	return gulp.src( './assets/material-icons/scss/material-icons-outlined.scss' )
		.pipe(
			plumber( {
				errorHandler: function( error ) {
					console.log( '=================ERROR=================' );
					console.log( error.message );
					this.emit( 'end' );
				}
			} )
		)
		.pipe( sass( { outputStyle: 'compressed' } ) )
		.pipe( autoprefixer( {
			browsers: ['last 10 versions'],
			cascade:  false
		} ) )

		.pipe( rename( 'material-icons-outlined.css' ) )
		.pipe( gulp.dest( './assets/material-icons/css/' ) )
		.pipe( notify( 'Compile Sass Done!' ) );
} );

gulp.task( 'css-icons-round', function() {
	return gulp.src( './assets/material-icons/scss/material-icons-round.scss' )
		.pipe(
			plumber( {
				errorHandler: function( error ) {
					console.log( '=================ERROR=================' );
					console.log( error.message );
					this.emit( 'end' );
				}
			} )
		)
		.pipe( sass( { outputStyle: 'compressed' } ) )
		.pipe( autoprefixer( {
			browsers: ['last 10 versions'],
			cascade:  false
		} ) )

		.pipe( rename( 'material-icons-round.css' ) )
		.pipe( gulp.dest( './assets/material-icons/css/' ) )
		.pipe( notify( 'Compile Sass Done!' ) );
} );

gulp.task( 'css-icons-sharp', function() {
	return gulp.src( './assets/material-icons/scss/material-icons-sharp.scss' )
		.pipe(
			plumber( {
				errorHandler: function( error ) {
					console.log( '=================ERROR=================' );
					console.log( error.message );
					this.emit( 'end' );
				}
			} )
		)
		.pipe( sass( { outputStyle: 'compressed' } ) )
		.pipe( autoprefixer( {
			browsers: ['last 10 versions'],
			cascade:  false
		} ) )

		.pipe( rename( 'material-icons-sharp.css' ) )
		.pipe( gulp.dest( './assets/material-icons/css/' ) )
		.pipe( notify( 'Compile Sass Done!' ) );
} );

//admin
gulp.task( 'admin-css', function() {
	return gulp.src( './assets/admin/scss/admin.scss' )
		.pipe(
			plumber( {
				errorHandler: function( error ) {
					console.log( '=================ERROR=================' );
					console.log( error.message );
					this.emit( 'end' );
				}
			} )
		)
		.pipe( sass( { outputStyle: 'compressed' } ) )
		.pipe( autoprefixer( {
			browsers: ['last 10 versions'],
			cascade:  false
		} ) )

		.pipe( rename( 'admin.css' ) )
		.pipe( gulp.dest( './assets/admin/css/' ) )
		.pipe( notify( 'Compile Sass Done!' ) );
} );

// update-icons-jsons
async function updateIconsJsons() {

	const fs = require( 'fs' );
	const request = require('request');

	const jsonMap = {
		'assets/material-icons/fonts/icons.json': 'https://raw.githubusercontent.com/google/material-design-icons/master/font/MaterialIcons-Regular.codepoints',
		'assets/material-icons/fonts/icons-outlined.json': 'https://raw.githubusercontent.com/google/material-design-icons/master/font/MaterialIconsOutlined-Regular.codepoints',
		'assets/material-icons/fonts/icons-round.json': 'https://raw.githubusercontent.com/google/material-design-icons/master/font/MaterialIconsRound-Regular.codepoints',
		'assets/material-icons/fonts/icons-sharp.json': 'https://raw.githubusercontent.com/google/material-design-icons/master/font/MaterialIconsSharp-Regular.codepoints',
	};

	for ( const [filePath, remoteUrl] of Object.entries( jsonMap ) ) {

		await request( remoteUrl, function( error, response, body ) {
			if ( !error && response.statusCode == 200 ) {

				let result = {
					icons: []
				};

				let bodyArray = body.split( '\n' );

				bodyArray.forEach( function( line ) {

					if ( '' === line ) {
						return;
					}

					let lineArray = line.split( ' ' );
					
					result.icons.push( lineArray[0] );
				} );

				const newFile = fs.createWriteStream( filePath );

				newFile.write( JSON.stringify( result, null, 2 ) );

				// Create a new _icons.scss file
				if ( -1 !== filePath.indexOf( 'icons.json' ) ) {
					let content = '$material-icons: ( "';
						content += result.icons.join( '", "' );
						content += '" );';

					const newCSSFile = fs.createWriteStream( 'assets/material-icons/scss/_icons.scss' );

					newCSSFile.write( content );
				}
			}
		} );
	}
}

gulp.task( 'update-icons-jsons', async function() {
	updateIconsJsons();
} );

//watch
gulp.task( 'watch', function() {
	gulp.watch( './assets/material-icons/scss/**', gulp.series( 'css-icons', 'css-icons-regular', 'css-icons-outlined', 'css-icons-round', 'css-icons-sharp' ) );
	gulp.watch( './assets/admin/scss/**', gulp.series( 'admin-css' ) );
} );
