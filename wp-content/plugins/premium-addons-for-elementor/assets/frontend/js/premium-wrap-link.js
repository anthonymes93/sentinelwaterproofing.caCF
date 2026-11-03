(function ($) {
	$(window).on("elementor/frontend/init", function () {
		var premiumWrapperLinkHandler = function ($scope) {
			if (!$scope.hasClass("premium-wrapper-link-yes")) return;

			var settings = $scope.data("premium-element-link");

			if (!settings) return;

			if (!isURL(settings.href)) return;

			function isURL(str) {
				// Regular expression for URL validation, supporting Unicode characters
				var urlPattern = /^https?:\/\/[^\s]+$/i;

				// Test the string against the regular expression
				return urlPattern.test(str);
			}

			var isUrlType = settings.type === "url",
				opensNewTab = isUrlType && settings.link.is_external,
				hidesReferrer = isUrlType && settings.link.nofollow,
				features = [];

			// Matches the noopener a target="_blank" link gets by default.
			if (opensNewTab) features.push("noopener");

			if (hidesReferrer) features.push("noreferrer");

			$scope.on("click.onWrapperLink", function () {
				window.open(
					settings.href,
					opensNewTab ? "_blank" : "_self",
					features.join(","),
				);
			});
		};

		elementorFrontend.hooks.addAction(
			"frontend/element_ready/global",
			premiumWrapperLinkHandler,
		);
	});
})(jQuery);
