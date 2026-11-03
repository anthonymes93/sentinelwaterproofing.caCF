(function ($) {
	var PremiumCarouselHandler = function ($scope, $) {
		var $carouselElem = $scope.find(".premium-carousel-wrapper"),
			settings = $($carouselElem).data("settings"),
			computedStyle = getComputedStyle($scope[0]),
			widgetID = $scope.data("id"),
			currentSlides = 0;

		//Fix conflict with Stretch Section option
		$carouselElem
			.find(".elementor-section-stretched")
			.removeClass("elementor-section-stretched");

		var $progressbar = $carouselElem.find(
			".premium-carousel-nav-progress-fill",
		);

		if ($carouselElem.find(".item-wrapper").length < 1) return;

		addSlideContent();

		function initCarouselTilt() {
			var reverse = settings.mouseTiltRev,
				thumbnailSlider = settings.hasNavSlider,
				$tiltTarget = thumbnailSlider
					? $scope.find(".premium-carousel-thumbnail")
					: $scope.find(".premium-carousel-template.item-wrapper");

			if (!$tiltTarget.length) return;

			$tiltTarget.each(function () {
				UniversalTilt.init({
					elements: [this],
					settings: {
						reverse: reverse,
					},
					callbacks: {
						onMouseLeave(el) {
							el.style.boxShadow = "0 45px 100px rgba(255,255,255,0)";
						},
						onDeviceMove(el) {
							el.style.boxShadow = "0 45px 100px rgba(255,255,255,0.3)";
						},
					},
				});
			});
		}

		function slideToShow(slick) {
			var slidesToShow = slick.options.slidesToShow,
				windowWidth = $(window).width();

			if (windowWidth > settings.tabletBreak) {
				slidesToShow = settings.slidesDesk;
			}

			if (windowWidth <= settings.tabletBreak) {
				slidesToShow = settings.slidesTab;
			}

			if (windowWidth <= settings.mobileBreak) {
				slidesToShow = settings.slidesMob;
			}

			return slidesToShow;
		}

		/**
		 * Used to add the template content to the carousel slide when the template source is an existing template on the page.
		 */
		function addSlideContent() {
			$scope
				.find(".premium-carousel-template[data-template-src]")
				.each(function () {
					var containerID = $(this).data("template-src");

					var $templateContent = $("#" + containerID);

					if (!$templateContent.length) {
						$(this).html(
							'<div class="premium-error-notice"><span>Container with ID <b>' +
								containerID +
								"</b> does not exist on this page. Please make sure that container ID is properly set from section settings -> Advanced tab -> CSS ID.<span></div>",
						);

						return;
					}

					if (!elementorFrontend.isEditMode()) {
						$(this).append($templateContent);
					} else {
						$scope.find(".elementor-element-overlay").remove();
						$(this).append($templateContent.clone(true));
					}
				});
		}

		$carouselElem.on("init", function (event) {
			event.preventDefault();

			setTimeout(function () {
				window.carouselTrigger = true;
				$scope.trigger("paCarouselLoaded");
				resetAnimations("init");

				if (settings.mouseTilt) {
					initCarouselTilt();
				}
			}, 500);

			$(this)
				.find("item-wrapper.slick-active")
				.each(function () {
					var $this = $(this);
					$this.addClass($this.data("animation"));
				});

			$(".slick-track").addClass("translate");
		});

		$carouselElem
			.find(".premium-carousel-inner")
			.slick(getSlickOptions(settings));

		if (settings.hasNavSlider) {
			var isVerticalNav =
				$scope.hasClass("pa-thumb-nav-pos-row") ||
				$scope.hasClass("pa-thumb-nav-pos-row-reverse");

			var navOptions = {
				rows: 0, // uses the DIVs we added directly without wrapping it in extra DIVs to create a grid layout, the Divs class will be alongside the slick-slide class.
				vertical: isVerticalNav,
				slidesToScroll: 1,
				slidesToShow: settings.slidesDesk,
				responsive: [
					{
						breakpoint: settings.tabletBreak,
						settings: {
							slidesToShow: settings.slidesTab,
							slidesToScroll: settings.slidesTab,
							swipe: settings.touchMove,
						},
					},
					{
						breakpoint: settings.mobileBreak,
						settings: {
							slidesToShow: settings.slidesMob,
							slidesToScroll: settings.slidesMob,
							swipe: settings.touchMove,
						},
					},
				],
				draggable: settings.draggable,
				infinite: true,
				autoplay: settings.thumbAutoplay,
				autoplaySpeed: settings.thumbAutoplaySpeed,
				arrows: settings.arrows,
				prevArrow: $carouselElem
					.find(".premium-carousel-nav-arrow-prev")
					.html(),
				nextArrow: $carouselElem
					.find(".premium-carousel-nav-arrow-next")
					.html(),
				dots: false,
				focusOnSelect: true,
				pauseOnHover: settings.pauseOnHover,
				// rtl: !isVerticalNav && elementorFrontend.config.is_rtl,
				rtl: false, // false as it causes issues in RTL mode with the .slick-current class
				centerMode: settings.centerMode,
				centerPadding:
					computedStyle.getPropertyValue("--pa-thumb-slider-center-padding") +
					"px",
				asNavFor: $carouselElem.find(".premium-carousel-inner"),
			};

			if (settings.arrowCustomPos) {
				navOptions.appendArrows = $carouselElem.find(
					".premium-carousel-arrows-wrapper",
				);
			}

			$scope.find("#premium-carousel-nav-" + widgetID).slick(navOptions);
		}

		function isRtl() {
			return settings.direction
				? "rtl" === settings.direction
				: elementorFrontend.config.is_rtl;
		}

		function getSlickOptions(settings) {
			var options = {
				vertical: settings.vertical,
				useTransform: true,
				fade: settings.fade,
				infinite: settings.infinite,
				speed: settings.speed,
				rows: 0,
				draggable: settings.draggable,
				rtl: !settings.vertical && isRtl(),
			};

			if (settings.hasNavSlider) {
				Object.assign(options, {
					slidesToShow: 1,
					slidesToScroll: 1,
					autoplay: false,
					arrows: false,
					centerMode: false,
					asNavFor: "#premium-carousel-nav-" + widgetID,
				});
			} else {
				var appearance = settings.appearance;

				Object.assign(options, {
					vertical: settings.vertical,
					slidesToScroll: "all" === appearance ? settings.slidesDesk : 1,
					slidesToShow: settings.slidesToShow,
					responsive: [
						{
							breakpoint: settings.tabletBreak,
							settings: {
								slidesToShow: settings.slidesTab,
								slidesToScroll: "all" === appearance ? settings.slidesTab : 1,
								swipe: settings.touchMove,
							},
						},
						{
							breakpoint: settings.mobileBreak,
							settings: {
								slidesToShow: settings.slidesMob,
								slidesToScroll: "all" === appearance ? settings.slidesMob : 1,
								swipe: settings.touchMove,
							},
						},
					],
					autoplay: settings.autoplay,
					autoplaySpeed: settings.autoplaySpeed,
					adaptiveHeight: settings.adaptiveHeight,
					pauseOnHover: settings.pauseOnHover,
					centerMode: settings.centerMode,
					centerPadding:
						computedStyle.getPropertyValue("--pa-carousel-center-padding") +
						"px",
					dots: settings.dots,
					variableWidth: settings.variableWidth,
					cssEase: settings.cssEase,
					arrows: settings.arrows,
					prevArrow: $carouselElem
						.find(".premium-carousel-nav-arrow-prev")
						.html(),
					nextArrow: $carouselElem
						.find(".premium-carousel-nav-arrow-next")
						.html(),
					customPaging: function () {
						var customDot = $carouselElem
							.find(".premium-carousel-nav-dot")
							.html();
						return customDot;
					},
					carouselNavigation: settings.carouselNavigation,
					templatesNumber: settings.templatesNumber,
				});

				if (settings.arrowCustomPos) {
					options.appendArrows = $carouselElem.find(
						".premium-carousel-arrows-wrapper",
					);
				}
			}

			return options;
		}

		function runProgress() {
			$progressbar.animate(
				{ width: "+=100%" },
				settings.autoplaySpeed,
				runProgress,
			);
		}

		if (settings.carouselNavigation === "progressbar") {
			var progress = (currentSlides + 1) / settings.templatesNumber;
			$carouselElem
				.find(".premium-carousel-nav-progressbar-fill")
				.css(
					"transform",
					"translate3d(0px, 0px, 0px) scaleX(" + progress + ") scaleY(1)",
				);
		}

		if (settings.carouselNavigation === "progress") {
			runProgress();
		}

		$scope
			.find(".premium-carousel-hidden")
			.removeClass("premium-carousel-hidden");
		$carouselElem.find(".premium-carousel-nav-arrow-prev").remove();
		$carouselElem.find(".premium-carousel-nav-arrow-next").remove();

		$carouselElem.find(".carousel-arrow").attr("tabindex", "0");
		// $carouselElem.find(".premium-carousel-nav-dot").remove();

		if (settings.variableWidth) {
			$carouselElem.find(".elementor-container").css("flex-wrap", "nowrap");
		}

		function resetAnimations(event) {
			var $slides = $carouselElem.find(".slick-slide");
			$progressbar.stop(true).animate({ width: 0 }, 0);

			if ("init" === event) $slides = $slides.not(".slick-current");

			$slides.find(".animated").each(function (index, elem) {
				var $elem = $(elem),
					settings = $elem.data("settings");

				if (!settings) return;

				if (!settings._animation && !settings.animation) return;

				var animation = settings._animation || settings.animation;

				$elem
					.removeClass("animated " + animation)
					.addClass("elementor-invisible");
			});

			if (settings.carouselNavigation === "progress") {
				runProgress();
			}
		}

		function triggerAnimation() {
			$carouselElem
				.find(".slick-active .elementor-invisible")
				.each(function (index, elem) {
					var $elem = $(elem),
						settings = $elem.data("settings");

					if (!settings) return;

					if (!settings._animation && !settings.animation) return;

					var delay = settings._animation_delay ? settings._animation_delay : 0,
						animation = settings._animation || settings.animation;

					setTimeout(function () {
						$elem
							.removeClass("elementor-invisible")
							.addClass(animation + " animated");
					}, delay);
				});
		}

		$carouselElem.on("afterChange", function (event, slick, currentSlide) {
			var slidesScrolled = slick.options.slidesToScroll,
				slidesToShow = slideToShow(slick),
				centerMode = slick.options.centerMode,
				slideToAnimate = currentSlide + slidesToShow - 1;

			//Trigger Animations for the current slide
			triggerAnimation();

			if (slidesScrolled === 1) {
				if (!centerMode === true) {
					var $inViewPort = $(this).find(
						"[data-slick-index='" + slideToAnimate + "']",
					);
					if ("null" != settings.animation) {
						$inViewPort
							.find("p, h1, h2, h3, h4, h5, h6, span, a, img, i, button")
							.addClass(settings.animation)
							.removeClass("premium-carousel-content-hidden");
					}
				}
			} else {
				for (var i = slidesScrolled + currentSlide; i >= 0; i--) {
					$inViewPort = $(this).find("[data-slick-index='" + i + "']");
					if ("null" != settings.animation) {
						$inViewPort
							.find("p, h1, h2, h3, h4, h5, h6, span, a, img, i, button")
							.addClass(settings.animation)
							.removeClass("premium-carousel-content-hidden");
					}
				}
			}

			//Fix carousel continues to work after last slide if autoplay is true and infinite is false.
			if (slick.$slides.length - 1 == currentSlide && !settings.infinite) {
				$carouselElem
					.find(".premium-carousel-inner")
					.slick("slickSetOption", "autoplay", false, false);
			}

			if (slick.options.carouselNavigation === "fraction") {
				$carouselElem.find("#currentSlide").text((currentSlide || 0) + 1);
			}

			if (slick.options.carouselNavigation === "progressbar") {
				var progress = (currentSlide + 1) / slick.options.templatesNumber;
				$carouselElem
					.find(".premium-carousel-nav-progressbar-fill")
					.css(
						"transform",
						"translate3d(0px, 0px, 0px) scaleX(" + progress + ") scaleY(1)",
					);
			}
		});

		$carouselElem.on("beforeChange", function (event, slick, currentSlide) {
			//Reset Animations for the other slides
			resetAnimations();

			var $inViewPort = $(this).find(
				"[data-slick-index='" + currentSlide + "']",
			);

			if ("null" != settings.animation) {
				$inViewPort
					.siblings()
					.find("p, h1, h2, h3, h4, h5, h6, span, a, img, i, button")
					.removeClass(settings.animation)
					.addClass("premium-carousel-content-hidden");
			}
		});

		if (settings.vertical) {
			var maxHeight = -1;

			elementorFrontend.elements.$window.on("load", function () {
				var $slides = $carouselElem.find(".slick-slide");

				$slides.each(function () {
					var h = $(this).height();
					if (h > maxHeight) {
						maxHeight = h;
					}
				});

				$slides.each(function () {
					var h = $(this).height();
					if (h < maxHeight) {
						$(this).css("margin", Math.ceil((maxHeight - h) / 2) + "px 0");
					}
				});
			});
		}

		$(document).ready(function () {
			settings.navigation.map(function (item, index) {
				if (item) {
					$(item).on("click", function () {
						var currentActive = $carouselElem
							.find(".premium-carousel-inner")
							.slick("slickCurrentSlide");

						if (index !== currentActive) {
							$carouselElem
								.find(".premium-carousel-inner")
								.slick("slickGoTo", index);
						}
					});
				}
			});

			$(".carousel-next-" + widgetID).on("click", function () {
				$carouselElem.find(".premium-carousel-inner").slick("slickNext");
			});

			$(".carousel-prev-" + widgetID).on("click", function () {
				$carouselElem.find(".premium-carousel-inner").slick("slickPrev");
			});
		});
	};

	$(window).on("elementor/frontend/init", function () {
		if (
			"undefined" !== typeof paElementsHandler &&
			paElementsHandler.isElementAlreadyExists("paCarousel")
		) {
			return false;
		}

		elementorFrontend.hooks.addAction(
			"frontend/element_ready/premium-carousel-widget.default",
			PremiumCarouselHandler,
		);
	});
})(jQuery);
