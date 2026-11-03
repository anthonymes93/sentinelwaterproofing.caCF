(function ($) {
	var PremiumContactFormHandler = function ($scope, $) {
		var $contactForm = $scope.find(".premium-cf7-container"),
			$input = $contactForm.find(
				'input[type="text"], input[type="email"], textarea, input[type="password"], input[type="date"], input[type="number"], input[type="tel"], input[type="file"], input[type="url"]',
			),
			settings = $contactForm.data("settings");

		if ("none" !== settings.fields_glass) {
			$contactForm
				.find(".wpcf7-text, .wpcf7-textarea")
				.addClass("premium-con-lq__" + settings.fields_glass);
		}

		if ("none" !== settings.submit_glass) {
			$contactForm
				.find(".wpcf7-text, .wpcf7-submit")
				.addClass("premium-con-lq__" + settings.submit_glass);
		}

		$input.wrap("<span class='wpcf7-span'>");

		$contactForm
			.find(".wpcf7-submit")
			.closest("p")
			.addClass("premium-cf-submit");

		$input.on("focus blur", function () {
			$(this).closest(".wpcf7-span").toggleClass("is-focused");
		});

		if (
			$scope.hasClass("premium-cf-anim-label") ||
			$scope.hasClass("premium-cf-anim-css-filters") ||
			$scope.hasClass("premium-cf-anim-label-pos-back")
		) {
			$contactForm.find("p").each(function (index, elem) {
				if ($(elem).find('input[type!="radio"], textarea').length > 0) {
					$(elem).find("label").addClass("cf7-text-input-label");

					var $inputTextarea = $(elem).find("input, textarea");

					$inputTextarea.on("focus", function () {
						$(elem).addClass("input-focused");
					});

					$inputTextarea.on("blur", function () {
						if ("" == $(this).val()) $(elem).removeClass("input-focused");
					});
				}
			});
		}

		if ($scope.hasClass("premium-cf-anim-label-letter")) {
			$contactForm.find("p").each(function (index, elem) {
				var $label = $(elem).find("label");
				var $inputTextarea = $(elem).find("input, textarea");

				$inputTextarea.on("focus", function () {
					var letterSpacing = parseFloat(
						$label.css("letter-spacing").replace("px", ""),
					);

					$label.css("letter-spacing", letterSpacing + 3 + "px");
				});

				$inputTextarea.on("blur", function () {
					var letterSpacing = parseFloat(
						$label.css("letter-spacing").replace("px", ""),
					);

					$label.css("letter-spacing", letterSpacing - 3 + "px");
				});
			});
		}
	};

	$(window).on("elementor/frontend/init", function () {
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/premium-contact-form.default",
			PremiumContactFormHandler,
		);
	});
})(jQuery);
