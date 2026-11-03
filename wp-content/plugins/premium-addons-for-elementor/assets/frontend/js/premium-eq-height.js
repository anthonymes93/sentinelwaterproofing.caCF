(function ($) {
	$(window).on("elementor/frontend/init", function () {
		var scrollObservers = {};

		// The editor re-renders the element with the same ID, so the previous render's listeners must go.
		// Only in the editor: on the frontend a template placed twice repeats the ID.
		function releasePreviousRender(id) {
			$(window).off("resize.premiumEqHeight-" + id);

			if (scrollObservers[id]) {
				scrollObservers[id].disconnect();
				delete scrollObservers[id];
			}
		}

		var PremiumEqualHeightHandler = function ($scope) {
			if (elementorFrontend.isEditMode())
				releasePreviousRender($scope.data("id"));

			if (!$scope.hasClass("premium-equal-height-yes")) return;

			var timeToWait = $scope.find(".premium-carousel-inner, ul.products")
				.length
				? 1500
				: 10;

			setTimeout(function () {
				// The editor may have re-rendered the element during the wait.
				if (!$.contains(document, $scope[0])) return;

				premiumEqHeightHandler($scope);
			}, timeToWait);
		};

		function premiumEqHeightHandler($scope) {
			var section = $scope,
				id = section.data("id"),
				editMode = elementorFrontend.isEditMode(),
				dataHolder = editMode
					? section.find("#premium-temp-equal-height-" + id)
					: section,
				addonSettings = dataHolder.data("pa-eq-height");

			if (!addonSettings) return;

			var enableOn = addonSettings.enableOn;

			if (0 === Object.keys(addonSettings).length) {
				return false;
			}

			if ("scroll" === addonSettings.trigger) {
				var eleObserver = new IntersectionObserver(function (entries) {
					if (
						entries.some(function (entry) {
							return entry.isIntersecting;
						})
					) {
						triggerEqualHeight();
						eleObserver.disconnect();
						delete scrollObservers[id];
					}
				});

				scrollObservers[id] = eleObserver;
				eleObserver.observe($scope[0]);
			} else {
				triggerEqualHeight();
			}

			function matchHeight(selector) {
				var $targets = section.find(selector),
					heights = [];

				//If the current widget doesn't have elementor-widget-container wrapper (Optimize Markup), then apply the effect on the outer container.
				if ($targets.length < 1) {
					selector = selector.replace(".elementor-widget-container", "");
					$targets = section.find(selector);
				}

				$targets.css("minHeight", "unset");

				jQuery.each($targets, function (key, valueObj) {
					heights.push($(valueObj).outerHeight(true));
				});

				$targets.css("minHeight", Math.max.apply(null, heights));
			}

			function triggerEqualHeight() {
				if (
					enableOn.includes(elementorFrontend.getCurrentDeviceMode()) &&
					0 !== addonSettings.target.length
				) {
					addonSettings.target.forEach(function (target) {
						matchHeight(target);
					});
				} else {
					section.find(addonSettings.target).css("minHeight", "unset");
				}
			}

			$(window).on("resize.premiumEqHeight-" + id, triggerEqualHeight);
		}

		elementorFrontend.hooks.addAction(
			"frontend/element_ready/section",
			PremiumEqualHeightHandler,
		);
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/container",
			PremiumEqualHeightHandler,
		);
	});
})(jQuery);
