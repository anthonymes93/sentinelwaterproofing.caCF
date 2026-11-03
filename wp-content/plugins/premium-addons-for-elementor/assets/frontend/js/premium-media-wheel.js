(function ($) {
	var PremiumAdvCarouselHandler = function ($scope, $) {
		var $outerContainer = $scope.find(".premium-adv-carousel__container"),
			settings = $outerContainer.data("settings"),
			$carouselContainer = $scope.find(
				".premium-adv-carousel__inner-container",
			);

		if (!settings) {
			return;
		}

		var animationType = settings.type;

		if ("infinite" === animationType) {
			var $mediaItemsContainer = $outerContainer.find(
					".premium-adv-carousel__items",
				),
				lightbox_type = settings.lightbox_type;

			if ("load" === settings.renderEvent) {
				runInfiniteAnimation();
			} else {
				// Using IntersectionObserverAPI.
				var wheelObserver = new IntersectionObserver(function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							runInfiniteAnimation();
							wheelObserver.unobserve(entry.target); // to only execute the callback func once.
						}
					});
				});

				wheelObserver.observe($scope[0]);
			}

			$carouselContainer.css("visibility", "inherit");

			// We need to set the animation on reaching viewpoint.
			if (settings.pauseOnHover) {
				setInfiniteAnimeState();
			}

			if (settings.scroll) {
				setInfiniteAnimeState();

				if (settings.dir === "horizontal") {
					$outerContainer
						.find(".premium-adv-carousel__inner-container")
						.mousewheel(function (e, delta) {
							this.scrollLeft -= delta * 30;
							e.preventDefault();
						});
				}
			} else {
				$outerContainer
					.find(".premium-adv-carousel__inner-container")
					.css({ overflow: "hidden" });
			}
		} else {
			// flipster animations.
			var $flipContainer = $scope.find(".premium-adv-carousel__items"),
				$flipItem = $scope.find(".premium-adv-carousel__item-outer-wrapper"),
				$buttonPrev = $scope.find(".premium-adv-carousel__prev-icon").html(),
				$buttonNext = $scope.find(".premium-adv-carousel__next-icon").html(),
				isSmallDevice = [
					"mobile",
					"mobile_extra",
					"tablet",
					"tablet_extra",
				].includes(elementorFrontend.getCurrentDeviceMode());

			$scope.find(".premium-adv-carousel__icons-holder").remove();

			$carouselContainer
				.flipster({
					itemContainer: $flipContainer,
					itemSelector: $flipItem,
					style: settings.type,
					fadeIn: 0,
					start: settings.start,
					loop: settings.loop,
					autoplay: settings.autoPlay,
					scrollwheel: settings.scroll,
					pauseOnHover: settings.pauseOnHover,
					click: settings.loop ? false : settings.click,
					keyboard: settings.keyboard,
					touch: settings.touch,
					spacing: settings.spacing,
					buttons: settings.buttons ? "custom" : false,
					buttonPrev: $buttonPrev,
					buttonNext: $buttonNext,
					onItemSwitch: function (newItem) {
						resetVideos();
						if (settings.autoplay_videos) {
							playActiveVideo($(newItem));
						}
					},
				})
				.css("visibility", "inherit");

			if (settings.autoplay_videos) {
				playActiveVideo();
			}

			if (settings.keyboard && !isSmallDevice) {
				// Using IntersectionObserverAPI.
				var eleObserver = new IntersectionObserver(function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							$.fn.focusWithoutScrolling = function () {
								var x = window.scrollX,
									y = window.scrollY;
								this.focus();
								window.scrollTo(x, y);
							};

							$carouselContainer.focusWithoutScrolling();

							eleObserver.unobserve(entry.target); // to only execute the callback func once.
						}
					});
				});

				eleObserver.observe($carouselContainer[0]);
			}

			// Fix: item click event when loop option is enabled navigates to the wrong slide.
			if (settings.loop && settings.click) {
				$scope
					.find(".premium-adv-carousel__item-outer-wrapper")
					.on("click.paFlipClick", function () {
						var itemIndex = $(this).index();
						$carouselContainer.flipster("jump", itemIndex);
					});
			}
		}

		if ("yes" === settings.light_box) {
			if ("default" === lightbox_type)
				$scope
					.find(
						".premium-adv-carousel__inner-container a[data-rel^='prettyPhoto']",
					)
					.prettyPhoto(getPrettyPhotoSettings());
		} else if (!settings.autoplay_videos) {
			// Play video on click (when autoplay_videos is disabled).
			$scope
				.find(".premium-adv-carousel__item .premium-adv-carousel__video-wrap")
				.each(function (index, item) {
					$(item)
						.closest(".premium-adv-carousel__item")
						.on("click.paPlayVid" + index, function () {
							resetVideos();
							playVideo($(this));
						});
				});
		}
		addSlideContent();

		/**
		 * Used to add the template content to the carousel slide when the template source is an exisitng template on the page.
		 */
		function addSlideContent() {
			$scope
				.find(".premium-adv-carousel__item--container[data-template-src]")
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

		function setInfiniteAnimeState() {
			$outerContainer
				.on("mouseenter.paMediaWheel", function () {
					$mediaItemsContainer.css("animation-play-state", "paused");
				})
				.on("mouseleave.paMediaWheel", function () {
					$mediaItemsContainer.css("animation-play-state", "running");
				});
		}

		function resetVideos() {
			$scope.find("iframe").attr("src", ""); // reset youtube/vimeo videos
			// reset self hosted videos.
			$video = $scope.find("video[pa-playing='true']").each(function () {
				var media = $(this).get(0);
				media.pause();
				media.currentTime = 0;
			});

			$scope
				.find(
					".premium-adv-carousel__video-icon, .premium-adv-carousel__vid-overlay",
				)
				.css("visibility", "visible");
			$scope
				.find(".premium-adv-carousel__media-wrap")
				.css("background", "unset");
		}

		// Resolves the active outer wrapper and delegates to playVideo.
		// Called without args on init (flipster__item--current is already set);
		// called with $(newItem) from onItemSwitch (fires before the class updates).
		function playActiveVideo($outerWrapper) {
			$outerWrapper = $outerWrapper || $scope.find(".flipster__item--current");
			playVideo($outerWrapper.find(".premium-adv-carousel__item"));
		}

		function playVideo($item) {
			var $videoWrap = $item.find(".premium-adv-carousel__video-wrap");

			if (!$videoWrap.length) {
				return;
			}

			$item.find(".premium-adv-carousel__media-wrap").css("background", "#000");
			$item
				.find(
					".premium-adv-carousel__video-icon, .premium-adv-carousel__vid-overlay",
				)
				.css("visibility", "hidden");

			if ("hosted" !== $videoWrap.data("type")) {
				var $iframeWrap = $item.find(".premium-adv-carousel__iframe-wrap");

				$("<iframe/>")
					.attr({
						src: $iframeWrap.data("src").replace("&mute", "&autoplay=1&mute"),
						frameborder: "0",
						allowfullscreen: "1",
						allow: "autoplay;encrypted-media;",
					})
					.css("visibility", "visible")
					.appendTo($iframeWrap.empty());
			} else {
				$videoWrap
					.find("video")
					.attr("pa-playing", "true")
					.css("visibility", "visible")
					.get(0)
					.play();
			}
		}

		function setHorizontalWidth() {
			var horAlignWidth = 0;

			$scope.find(".premium-adv-carousel__item").each(function () {
				horAlignWidth += $(this).outerWidth(true);
			});

			$mediaItemsContainer.css({ width: horAlignWidth });

			return horAlignWidth;
		}

		function runInfiniteAnimation() {
			var $mediaItem = $scope.find(".premium-adv-carousel__item"),
				direction = settings.dir,
				scrollDir = settings.reverse,
				// verAlignWidth = 10,
				verAlignWidth = 0,
				containerHeight = $mediaItemsContainer.outerHeight();

			if ("horizontal" === direction) {
				var horAlignWidth = setHorizontalWidth();

				$mediaItemsContainer.css({
					height: containerHeight,
					position: "relative",
				});

				$mediaItemsContainer
					.find(".premium-adv-carousel__item-outer-wrapper")
					.css("position", "absolute");

				if ("normal" === scrollDir) {
					$mediaItemsContainer
						.find(".premium-adv-carousel__item-outer-wrapper")
						.css("right", 0);
				} else {
					$mediaItemsContainer.css(
						"left",
						"-" + horAlignWidth / $mediaItem.length + "px",
					);
					if ("rtl" === document.dir) {
						$mediaItemsContainer.css("direction", "ltr");
					}
				}

				var slidesSpacing =
						getComputedStyle($scope[0]).getPropertyValue(
							"--pa-wheel-spacing",
						) || 0,
					factor = "normal" === scrollDir ? -1 : 1,
					accumlativeWidth = 0;

				// clone the items till the width is equal to the viewport width
				while (
					horAlignWidth <= $scope.outerWidth(true) ||
					horAlignWidth - $scope.outerWidth(true) <= 400
				) {
					cloneItems();
					// recalculate the full width.
					horAlignWidth = setHorizontalWidth();
				}

				gsap.set($scope.find(".premium-adv-carousel__item-outer-wrapper"), {
					// animates the carousel.
					x: function (i) {
						transformVal = accumlativeWidth;

						accumlativeWidth =
							accumlativeWidth +
							$scope
								.find(".premium-adv-carousel__item")
								.eq(i)
								.outerWidth(true) +
							parseFloat(slidesSpacing);

						return transformVal * factor;
					},
				});

				var fullWidth =
					horAlignWidth +
					$scope.find(".premium-adv-carousel__item").length *
						parseFloat(slidesSpacing);
				var animation = gsap.to(
					$scope.find(".premium-adv-carousel__item-outer-wrapper"),
					{
						duration: settings.speed,
						ease: "none",
						x: ("normal" === scrollDir ? "-=" : "+=") + fullWidth,
						modifiers: {
							x: gsap.utils.unitize(function (x) {
								var remainder = parseFloat(x) % fullWidth,
									clampedValue = Math.max(remainder, -fullWidth);

								return "normal" === scrollDir ? clampedValue : remainder;
							}),
						},
						repeat: -1,
					},
				);
			} else {
				$mediaItem.each(function () {
					verAlignWidth += $(this).outerHeight(true);
				});

				$mediaItemsContainer.css({
					position: "relative",
					height: verAlignWidth,
				});

				$mediaItemsContainer
					.find(".premium-adv-carousel__item-outer-wrapper")
					.css("position", "absolute");

				if ("normal" === scrollDir) {
					$mediaItemsContainer
						.find(".premium-adv-carousel__item-outer-wrapper")
						.css("bottom", 0);
				} else {
					$mediaItemsContainer.css(
						"top",
						"-" + verAlignWidth / $mediaItem.length + "px",
					);
				}

				var slidesSpacing =
						getComputedStyle($scope[0]).getPropertyValue(
							"--pa-wheel-spacing",
						) || 0,
					factor = "normal" === scrollDir ? -1 : 1,
					accumlativeHeight = 0;

				gsap.set($scope.find(".premium-adv-carousel__item-outer-wrapper"), {
					// animates the carousel.
					y: function (i) {
						transformVal = accumlativeHeight;

						accumlativeHeight =
							accumlativeHeight +
							$scope
								.find(".premium-adv-carousel__item")
								.eq(i)
								.outerHeight(true) +
							parseFloat(slidesSpacing);

						return transformVal * factor;
					},
				});

				var fullHeight =
					verAlignWidth +
					$scope.find(".premium-adv-carousel__item").length *
						parseFloat(slidesSpacing);

				var animation = gsap.to(
					$scope.find(".premium-adv-carousel__item-outer-wrapper"),
					{
						duration: settings.speed,
						ease: "none",
						y: ("normal" === scrollDir ? "-=" : "+=") + fullHeight,
						modifiers: {
							y: gsap.utils.unitize(function (y) {
								var remainder = parseFloat(y) % fullHeight,
									clampedValue = Math.max(remainder, -fullHeight);

								return "normal" === scrollDir ? clampedValue : remainder;
							}),
						},
						repeat: -1,
					},
				);
			}

			//Pause on hover
			if (settings.pauseOnHover) {
				$scope.hover(
					function () {
						animation.pause();
					},
					function () {
						animation.play();
					},
				);
			}
		}

		function cloneItems() {
			var itemLen = $mediaItemsContainer.children().length,
				docFragment = new DocumentFragment();

			$mediaItemsContainer
				.find(".premium-adv-carousel__item-outer-wrapper:lt(" + itemLen + ")")
				.clone(true, true)
				.appendTo(docFragment);

			$mediaItemsContainer.append(docFragment);
		}

		function getPrettyPhotoSettings() {
			return {
				theme: settings.theme,
				hook: "data-rel",
				opacity: 0.7,
				show_title: false,
				deeplinking: false,
				overlay_gallery: settings.overlay,
				custom_markup: "",
				default_width: 900,
				default_height: 506,
				social_tools: "",
			};
		}
	};

	$(window).on("elementor/frontend/init", function () {
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/premium-media-wheel.default",
			PremiumAdvCarouselHandler,
		);
	});
})(jQuery);
