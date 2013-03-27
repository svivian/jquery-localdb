
(function ($) {
	$.extend({

		// @dbAjaxPath:		URL path to which all AJAX requests are made
		// @dbVersion:		version of our localStorage objects to check against
		localDb: function (dbAjaxPath, dbVersion) {

			// the data from localStorage as an object
			var localDb = null;

			// global localStorage object for older browsers
			if ( !localStorage )
				localStorage = {};

			/* Check response from server and save to localStorage
				@response:	the JSON output
				@tableKey:	table in which to save the data
			*/
			function saveResponse (response, tableKey) {
				var db = {};
				try {
					db = JSON.parse(response);
				}
				catch (e) {
					// bad response from server
					console.log('Server response was not JSON');
					return false;
				}

				localStorage[tableKey] = response;
				// TODO: do something with `db` object?
				updateTableVersion( tableKey );
			}

			/* Sets the version number of the table.
				@tableKey:	the table
			*/
			function updateTableVersion (tableKey) {
				var obj = JSON.parse(localStorage.versions);
				obj[tableKey] = dbVersion;
				localStorage.versions = JSON.stringify(obj);
			}

			/* Check if all tables are loaded yet and runs callback when they are.
				@reqTables:		array of required tables
				@callback:		function to run when loaded
			*/
			function checkLoaded (reqTables, callback) {
				console.log('Checking if loaded...');
				var loaded = true;
				for ( var i in reqTables ) {
					var key = reqTables[i];
					// TODO: check table version
					if ( !localStorage[key] )
						loaded = false;
				}

				if ( loaded )
					setTimeout( callback, 10 );
				else
					setTimeout( function() { checkLoaded( reqTables, callback ) }, 1000 );
			}

			return {

				/* Fetch all data from localStorage and/or AJAX.
					@reqTables:		array of required tables
					@callback:		function to run when loaded
				*/
				load: function (reqTables, callback) {
					// whether we will fetch data via AJAX
					var fetchData = false;
					// list of tables we need to load via AJAX
					var loadTables = [];

					if ( localStorage.versions ) {
						// check if we need to refresh the data or not
						var tableVersions = JSON.parse( localStorage.versions );

						for ( var i in reqTables ) {
							var key = reqTables[i];
							// table doesn't exist yet or outdated version
							if ( !localStorage[key] || tableVersions[key] != dbVersion )
								loadTables.push(key);
						}
					}
					else {
						// no versions stored, so fetch everything
						localStorage.versions = '{}';
						loadTables = reqTables;
					}

					if ( loadTables.length > 0 ) {
						for ( var i in loadTables ) {
							var key = loadTables[i];
							$.ajax({
								url: dbAjaxPath + key,
								success: function( response ) {
									saveResponse( response, key );
									console.log('Fetched update from server');
								},
								error: function() {
									console.log('Error fetching data from server');
								}
							});
						}
					}

					checkLoaded( reqTables, callback );
				},

				table: function (tableKey) {
					return localStorage[tableKey];
				}

			}; // end public return

		} // end localDb function

	});
})(jQuery);