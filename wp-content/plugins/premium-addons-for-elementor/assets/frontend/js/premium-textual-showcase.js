(function ($) {
	var PremiumTextualShowcaseHandler = function ($scope, $) {
		var trigger = $scope
				.find(".pa-txt-sc__outer-container")
				.hasClass("pa-trigger-on-viewport")
				? "viewport"
				: "hover",
			hasGrowEffect = $scope.find(".pa-txt-sc__effect-grow").length,
			entranceAnimation = $scope
				.find(".pa-txt-sc__outer-container")
				.data("list-animation");

		// Using IntersectionObserverAPI.
		var itemObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					if (hasGrowEffect) {
						// grow always triggered on viewport.
						$scope
							.find(".pa-txt-sc__effect-grow")
							.css("clip-path", "inset(0 0 0 0)");
					}

					if ("viewport" === trigger) {
						triggerItemsEffects();
					}

					if (entranceAnimation) {
						var element = $(entry.target),
							delay = element.data("delay");

						setTimeout(function () {
							element
								.css("opacity", "1")
								.addClass("animated " + entranceAnimation);
						}, delay);
					}

					itemObserver.unobserve(entry.target); // to only execute the callback func once.
				}
			});
		});

		if (entranceAnimation) {
			$scope.find(".pa-txt-sc__item-container").each(function (index, item) {
				itemObserver.observe($(item)[0]); // we need to apply this on each item
			});
		} else {
			itemObserver.observe($scope[0]);
		}

		$scope.off(".PaTextualHandler");
		if ("viewport" !== trigger) {
			$scope.on(
				"mouseenter.PaTextualHandler mouseleave.PaTextualHandler",
				function () {
					triggerItemsEffects();
				},
			);
		}

		function triggerItemsEffects() {
			$scope
				.find(".pa-txt-sc__item-container:not(.pa-txt-sc__effect-none)")
				.each(function () {
					var effectName = this.className
						.match(/pa-txt-sc__effect-\S+/)[0]
						.replace("pa-txt-sc__effect-", "");
					if ("grow" === effectName) {
						return true;
					}

					if (
						[
							"outline",
							"curly",
							"circle",
							"x",
							"h-underline",
							"underline-zigzag",
							"double-underline",
							"diagonal",
							"strikethrough",
						].includes(effectName)
					) {
						// $(this).find('svg').toggleClass('outline');
						$(this).find("svg").addClass("outline");
					} else {
						// $(this).toggleClass(effectName);
						$(this).addClass(effectName);
					}
				});
		}
	};

	var PremiumMaskHandler = function ($scope, $) {
		var txtShowcaseElem = $scope.find(
				".pa-txt-sc__effect-min-mask .pa-txt-sc__main-item.pa-txt-sc__item-text",
			),
			mask = $scope.hasClass("premium-mask-yes") || txtShowcaseElem.length;

		if (!mask) return;

		var target = ".pa-txt-sc__effect-min-mask";

		$scope
			.find(target)
			.find(
				"span:not(.premium-title-style7-stripe-wrap):not(.premium-title-img):not(.pa-txt-sc__hov-item)",
			)
			.each(function (index, span) {
				var frag = document.createDocumentFragment();

				$(this)
					.text()
					.split(" ")
					.forEach(function (item) {
						if ("" !== item) {
							// Build the word span via textContent so attacker-controlled
							// characters can never be reparsed as live markup (DOM XSS).
							frag.appendChild(document.createTextNode(" "));
							var wordSpan = document.createElement("span");
							wordSpan.className = "premium-mask-span";
							wordSpan.textContent = item;
							frag.appendChild(wordSpan);
						}
					});

				$(this).text("").append(frag);
			});

		// Using IntersectionObserverAPI.
		var eleObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					if (txtShowcaseElem.length) {
						$(txtShowcaseElem).addClass("premium-mask-active");
					} else {
						$($scope).addClass("premium-mask-active");
					}

					eleObserver.unobserve(entry.target); // to only execute the callback func once.
				}
			});
		});

		eleObserver.observe($scope[0]);
	};

	$(window).on("elementor/frontend/init", function () {
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/premium-textual-showcase.default",
			PremiumTextualShowcaseHandler,
		);
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/premium-textual-showcase.default",
			PremiumMaskHandler,
		);
	});
})(jQuery);
