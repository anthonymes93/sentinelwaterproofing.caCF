(function ($) {
	var PremiumMaskHandler = function ($scope, $) {
		var mask = $scope.hasClass("premium-mask-yes");

		if (!mask) return;

		var target = ".premium-dual-header-first-header";

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

		// Mask makes both title spans inline-block, which trims the space inside them.
		var $firstSpan = $scope.find(".premium-dual-header-first-span");

		if ($firstSpan.next().length) {
			$firstSpan.after(document.createTextNode(" "));
		}

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

	$(window).on("elementor/frontend/init", function () {
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/premium-addon-dual-header.default",
			PremiumMaskHandler,
		);
	});
})(jQuery);
