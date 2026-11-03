// Loads lottie.js into the editor preview only once an element on the canvas needs it,
// instead of on every editor load (see Addons_Integration::load_preview_libs_on_demand()).
(function ($) {
	"use strict";

	function loadLottie() {
		window.paLottieLoadedOnDemand = true;

		return window.paPreviewLibs.load("lottie");
	}

	function usesLottie($scope) {
		return (
			$scope.hasClass("premium-lottie-yes") ||
			$scope.find(".premium-lottie-animation").length > 0
		);
	}

	// Stands in for the class lottie.js defines, so callers such as Global Tooltips and
	// Premium Addons Pro widgets keep working; lottie.js replaces it once loaded.
	function LottieAnimationPlaceholder($elem) {
		this.init = function () {
			loadLottie().then(function () {
				if (window.premiumLottieAnimations !== LottieAnimationPlaceholder) {
					new window.premiumLottieAnimations($elem).init();
				}
			});
		};
	}

	if (!window.premiumLottieAnimations) {
		window.premiumLottieAnimations = LottieAnimationPlaceholder;
	}

	$(window).on("elementor/frontend/init", function () {
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/global",
			function ($scope) {
				if (usesLottie($scope)) {
					loadLottie();
				}
			},
		);
	});
})(jQuery);
