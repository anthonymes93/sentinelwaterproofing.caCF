(function ($) {
	var PremiumMaskHandler = function ($scope, $) {
		var mask = $scope.hasClass("premium-mask-yes");

		if (!mask) return;

		var target = ".premium-title-header";
		$scope
			.find(target)
			.find(".premium-title-icon, .premium-title-img")
			.addClass("premium-mask-span");

		$scope
			.find(target)
			.find(".premium-title-text")
			.each(function (index, span) {
				var frag = document.createDocumentFragment();

				$(this)
					.contents()
					.each(function () {
						var focusedClass =
							1 === this.nodeType &&
							this.classList.contains("premium-title__focused-word")
								? " premium-title__focused-word"
								: "";

						(this.textContent || "").split(" ").forEach(function (item) {
							if ("" !== item) {
								// Build the word span via textContent so attacker-controlled
								// characters can never be reparsed as live markup (DOM XSS).
								frag.appendChild(document.createTextNode(" "));
								var wordSpan = document.createElement("span");
								wordSpan.className = "premium-mask-span" + focusedClass;
								wordSpan.textContent = item;
								frag.appendChild(wordSpan);
							}
						});
					});

				$(this).empty().append(frag);
			});

		// Using IntersectionObserverAPI.
		var eleObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					$($scope).addClass("premium-mask-active");

					eleObserver.unobserve(entry.target); // to only execute the callback func once.
				}
			});
		});

		eleObserver.observe($scope[0]);
	};

	var PremiumTitleHandler = function ($scope, $) {
		var $titleContainer = $scope.find(".premium-title-container"),
			$titleElement = $titleContainer.find(".premium-title-text");

		var $style9 = $scope.find(".premium-title-style9");

		if ($style9.length) {
			$style9.each(function () {
				var elm = $(this);
				var holdTime = elm.attr("data-blur-delay") * 1000;
				elm.attr("data-animation-blur", "process");
				elm.find(".premium-title-style9-letter").each(function (index, letter) {
					index += 1;
					var animateDelay;
					if ($("body").hasClass("rtl")) {
						animateDelay = 0.2 / index + "s";
					} else {
						animateDelay = index / 20 + "s";
					}
					$(letter).css({
						"-webkit-animation-delay": animateDelay,
						"animation-delay": animateDelay,
					});
				});
				setInterval(function () {
					elm.attr("data-animation-blur", "done");
					setTimeout(function () {
						elm.attr("data-animation-blur", "process");
					}, 150);
				}, holdTime);
			});
		}

		if ($titleContainer.find(".premium-title-style8").length) {
			var shinyDelay = $titleElement.attr("data-shiny-delay") * 1000,
				shinyDuration = $titleElement.attr("data-shiny-dur") * 1000;

			function runShinyEffect() {
				$titleElement.get(0).setAttribute("data-animation", "shiny");

				setTimeout(function () {
					$titleElement.removeAttr("data-animation");
				}, shinyDuration);
			}

			(function repeatShinyEffect() {
				runShinyEffect();
				setTimeout(repeatShinyEffect, shinyDelay);
			})();
		}
	};

	$(window).on("elementor/frontend/init", function () {
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/premium-addon-title.default",
			PremiumTitleHandler,
		);
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/premium-addon-title.default",
			PremiumMaskHandler,
		);
	});
})(jQuery);
