// Loads vendor libraries into the editor preview only once an element needs them,
// instead of on every editor load (see Addons_Integration::load_preview_libs_on_demand()).
(function ($) {
	"use strict";

	// Libraries used only as jQuery plugins, so a stand-in $.fn method can trigger the load.
	var JQUERY_PLUGINS = ["isotope"];

	var requests = {};

	function load(name) {
		if (!requests[name]) {
			requests[name] = new Promise(function (resolve, reject) {
				var script = document.createElement("script");

				script.src = window.paPreviewLibsSrc[name];
				script.onload = resolve;
				script.onerror = reject;

				document.body.appendChild(script);
			});
		}

		return requests[name];
	}

	// Queues each call until the library replaces the stand-in, then replays it in order.
	// Callers get the collection back for chaining; no PA or PA Pro caller reads a
	// plugin return value before the library has loaded.
	function addJQueryPluginStandIn(name) {
		var standIn = function () {
			var $elements = this,
				args = arguments;

			load(name).then(function () {
				if ($.fn[name] !== standIn) {
					$.fn[name].apply($elements, args);
				}
			});

			return this;
		};

		$.fn[name] = standIn;
	}

	JQUERY_PLUGINS.forEach(function (name) {
		if (window.paPreviewLibsSrc[name] && !$.fn[name]) {
			addJQueryPluginStandIn(name);
		}
	});

	window.paPreviewLibs = {
		load: load,
	};
})(jQuery);
