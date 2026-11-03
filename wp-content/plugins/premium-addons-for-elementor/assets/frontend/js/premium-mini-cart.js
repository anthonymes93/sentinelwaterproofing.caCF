(function ($) {
	var instanceCounter = 0;

	/**
	 * data-id is not unique: the same Elementor element can be printed twice on one page, for
	 * example a responsive header duplicate, and both copies carry the same id. Handlers bound
	 * on document.body need a separator that follows the DOM node instead.
	 */
	function getInstanceNamespace($widget) {
		var namespace = $widget.data("paMcNs");

		if (!namespace) {
			namespace = "paMc" + ++instanceCounter;
			$widget.data("paMcNs", namespace);
		}

		return namespace;
	}

	function eachMiniCart(callback) {
		$(".elementor-widget-premium-mini-cart").each(function () {
			var $widget = $(this),
				widgetSettings = $widget
					.find(".pa-woo-mc__outer-container")
					.data("settings");

			if (widgetSettings) {
				callback($widget, widgetSettings);
			}
		});
	}

	/** Unlike toggleMiniCart, calling this on an already open cart does nothing. */
	function openMiniCart($widget, widgetSettings) {
		var widgetId = $widget.data("id"),
			$content = $widget.find(".pa-woo-mc__content-wrapper-" + widgetId);

		if (!$content.length || $content.hasClass("pa-woo-mc__open")) {
			return;
		}

		clearTimeout($widget.data("paMcCloseTimer"));

		if ("slide" === widgetSettings.type) {
			$widget
				.find(".pa-woo-mc__overlay-" + widgetId)
				.removeClass("premium-addons__v-hidden");
		}

		$content
			.removeClass("premium-addons__v-hidden")
			.addClass("pa-woo-mc__open");

		if ($widget.find(".slick-slider").length) {
			$widget.find(".pa-woo-mc__cross-sells").slick("setPosition");
		}
	}

	/**
	 * WooCommerce fires added_to_cart once per AJAX add, on the body. One listener for the whole
	 * page serves every mini cart on it, so re-running the widget handler, which Elementor does
	 * on every element_ready, cannot stack listeners or toggle the cart back closed.
	 */
	function bindAutoOpenOnAjaxAdd() {
		$(document.body)
			.off("added_to_cart.paMiniCart")
			.on("added_to_cart.paMiniCart", function () {
				eachMiniCart(function ($widget, widgetSettings) {
					if (!widgetSettings.openAutomatically) {
						return;
					}

					setTimeout(function () {
						openMiniCart($widget, widgetSettings);
					}, widgetSettings.cartDelay || 0);
				});
			});
	}

	var PremiumMiniCartHandler = function ($scope, $) {
		var settings = $scope.find(".pa-woo-mc__outer-container").data("settings");

		if (!settings) {
			return;
		}

		var triggerEvent = settings.trigger,
			type = settings.type,
			id = $scope.data("id"),
			instanceNs = getInstanceNamespace($scope),
			openAutomatically = settings.openAutomatically,
			cartDelay = settings.cartDelay,
			paodometer,
			paSubtotalOdometer;

		$scope
			.find(".pa-woo-mc__inner-container")
			.off(
				"click.paToggleMiniCart mouseenter.paToggleMiniCart mouseleave.paToggleMiniCart",
			);

		// The hover close handler is bound on $scope itself, so it needs its own cleanup.
		$scope.off("mouseleave.paToggleMiniCart");

		initWidgetEvents();

		initCartContentEvents();

		updateCartDynamicText();

		initCountingEffect();

		if (settings.crossSells) {
			setTimeout(function () {
				initCrossSellsCarousel();
			}, 0);
		}

		/**
		 * A non-AJAX add reloads the page, so there is no added_to_cart event to react to.
		 * The server tells us the reload was caused by this visitor's own add to cart.
		 */
		if (openAutomatically && PAWooMCartSettings.productAddedToCart) {
			setTimeout(function () {
				openMiniCart($scope, settings);
			}, cartDelay || 0);
		}

		bindAutoOpenOnAjaxAdd();

		// Reinitialize the event listeners after the mini cart is refreshed.
		var fragmentEvents =
			"wc_fragments_loaded." +
			instanceNs +
			" wc_fragments_refreshed." +
			instanceNs;

		$(document.body)
			.off(fragmentEvents)
			.on(fragmentEvents, function () {
				// A theme or Elementor re-render can replace the widget node; drop the stale binding.
				if (!$.contains(document.documentElement, $scope[0])) {
					$(document.body).off("." + instanceNs);
					return;
				}

				hideContentIfEmptyCart();
				initCartContentEvents();
				updateCartDynamicText();

				if (settings.crossSells) {
					setTimeout(function () {
						initCrossSellsCarousel();
					}, 0);
				}

				if ($scope.hasClass("premium-mc-counting-yes")) {
					setTimeout(updateCountingEffect, 0);
				}
			});

		if (settings.cssSelector) {
			var cartSelector = settings.cssSelector,
				selectorName = cartSelector.replace(/^[.#]/, "");

			$(cartSelector)
				.off("click.paCustomTrigger")
				.on("click.paCustomTrigger", function (e) {
					e.preventDefault();

					$(
						'.elementor-widget-premium-mini-cart .pa-woo-mc__outer-container[data-cart-selector="' +
							selectorName +
							'"]',
					)
						.find(".pa-woo-mc__inner-container")
						.trigger("click.paToggleMiniCart");
				});
		}

		/**Helper Function */

		function initCountingEffect() {
			var isEnabled = $scope.hasClass("premium-mc-counting-yes");

			if (!isEnabled) {
				return;
			}

			if (
				$scope.find(".pa-woo-mc__badge.pa-counting .odometer-wrapper").length
			) {
				paodometer = new Odometer({
					el: $scope.find(".pa-woo-mc__badge.pa-counting .odometer-wrapper")[0],
					value: $scope.find(".pa-woo-mc__count-placeholder").text(),
					format: "(,ddd).dd",
				});
			}

			if (
				$scope.find(".pa-woo-mc__subtotal.pa-counting .pa-woo-mc__subtotal-val")
					.length
			) {
				paSubtotalOdometer = new Odometer({
					el: $scope.find(
						".pa-woo-mc__subtotal.pa-counting .pa-woo-mc__subtotal-val",
					)[0],
					value: $scope
						.find(".pa-woo-mc__text-wrapper .pa-woo-mc__subtotal-placeholder")
						.text(),
					format: "(,ddd).dd",
				});
			}
		}

		function updateCountingEffect() {
			var newCount = $scope.find(".pa-woo-mc__count-placeholder").text(),
				newSubtotal = $scope
					.find(".pa-woo-mc__text-wrapper .pa-woo-mc__subtotal-placeholder")
					.text();

			if (paodometer && $scope.find(".pa-woo-mc__badge.pa-counting").length) {
				paodometer.update(newCount);
			}

			if (
				paSubtotalOdometer &&
				$scope.find(".pa-woo-mc__subtotal.pa-counting .pa-woo-mc__subtotal-val")
					.length
			) {
				paSubtotalOdometer.update(newSubtotal);
			}
		}

		function initCrossSellsCarousel() {
			$scope.find(".pa-woo-mc__cross-sells").slick({
				infinite: true,
				draggable: true,
				pauseOnHover: true,
				arrows: false,
				slidesToShow: settings.slidesToShow || 3,
				slidesToScroll: settings.slidesToScroll || 1,
				speed: settings.speed || 1000,
				autoplay: settings.autoplay,
				autoplaySpeed: settings.autoplaySpeed || 5000,
				rtl: elementorFrontend.config.is_rtl,
			});

			//cross sells nav.
			$scope
				.find(".pa-woo-mc__cross-sells-arrows a")
				.off("click.paCrossSellsNav")
				.on("click.paCrossSellsNav", function () {
					if ($(this).hasClass("prev-arrow")) {
						$scope.find(".pa-woo-mc__cross-sells").slick("slickPrev");
					} else if ($(this).hasClass("next-arrow")) {
						$scope.find(".pa-woo-mc__cross-sells").slick("slickNext");
					}
				});

			if (
				$scope.find(".pa-woo-mc__cross-sells .pa-woo-mc__cross-sell-product")
					.length > 1
			) {
				// show carousel arrows.
				$scope.find(".pa-woo-mc__cross-sells-arrows").css({
					visibility: "inherit",
					opacity: "1",
				});
			} else {
				// hide carousel arrows.
				$scope.find(".pa-woo-mc__cross-sells-arrows").css({
					visibility: "hidden",
					opacity: "0",
				});
			}
		}

		/**Hides the cart footer if the cart is empty. */
		function hideContentIfEmptyCart() {
			if (
				$(".pa-woo-mc__content-wrapper-" + id + " .pa-woo-mc__empty-msg").length
			) {
				$(".pa-woo-mc__content-wrapper-" + id).addClass("pa-hide-content");
			} else {
				$(".pa-woo-mc__content-wrapper-" + id).removeClass("pa-hide-content");
			}
		}

		/** Handles Mini Cart Display */
		function toggleMiniCart(e) {
			if ("hover" === triggerEvent) {
				e.stopPropagation();
				clearTimeout($scope.data("paMcCloseTimer"));

				$scope
					.find(".pa-woo-mc__content-wrapper-" + id)
					.removeClass("premium-addons__v-hidden")
					.addClass("pa-woo-mc__open");
			} else {
				if ("slide" === type) {
					$(".pa-woo-mc__overlay-" + id).removeClass(
						"premium-addons__v-hidden",
					); // show overlay for slide type.
				}

				$scope
					.find(".pa-woo-mc__content-wrapper-" + id)
					.removeClass("premium-addons__v-hidden")
					.toggleClass("pa-woo-mc__open");
			}

			// refresh carousel on opening the mini cart.
			if ($scope.find(".slick-slider").length > 0) {
				$scope.find(".pa-woo-mc__cross-sells").slick("setPosition");
			}
		}
		/**
		 * Appends a tax label to a given subtotal.
		 */
		function appendTaxLabel(labelText) {
			var $subtotal = $scope.find(
					".pa-woo-mc__inner-container .pa-woo-mc__subtotal",
				),
				$footerSubtotal = $scope.find(
					".pa-woo-mc__cart-footer .pa-woo-mc__subtotal",
				);

			// Check explicit flags from settings (filter-driven) first, fall back to prefix classes (UI control-driven).
			var triggerEnabled =
					settings.triggerLabelEnabled ||
					$scope.hasClass("pa-trigger-label-yes"),
				footerEnabled =
					settings.footerLabelEnabled || $scope.hasClass("pa-footer-label-yes");

			if (
				triggerEnabled &&
				0 === $subtotal.find(".pa-woo-mc__tax-label").length
			) {
				$subtotal.append(
					' <small class="pa-woo-mc__tax-label">' + labelText + "</small>",
				);
			}

			if (
				footerEnabled &&
				0 === $footerSubtotal.find(".pa-woo-mc__tax-label").length
			) {
				$footerSubtotal.append(
					' <small class="pa-woo-mc__tax-label">' + labelText + "</small>",
				);
			}
		}

		/**
		 * Updates Cart Dynamic Text.
		 * We add the text here as it gets replaced with only the items' count when
		 * WC Fragments are refreshed.
		 */
		function updateCartDynamicText() {
			var countTxt = $scope.find("div[data-pa-count-txt]").data("pa-count-txt");

			if (countTxt) {
				var itemCount = $scope.find(".pa-woo-mc__cart-count").text();

				if ($scope.hasClass("pa-woo-mc__layout-3")) {
					// in layout 3, the count text is inside the cart header.
					var rawCount = $scope
						.find(".pa-woo-mc__cart-count")
						.text()
						.match(/\d+/);
					var itemCount = rawCount ? rawCount[0] : 0;

					$scope
						.find(".pa-woo-mc__cart-header .pa-woo-mc__cart-count")
						.text(itemCount + " " + countTxt);
				} else {
					if (countTxt.includes("{{count}}")) {
						// all layouts but layout 3.
						var newTxt = countTxt.replace(
							"{{count}}",
							'<span class="pa-woo-mc__cart-count">' + itemCount + "</span>",
						);
						$scope
							.find(".pa-woo-mc__cart-footer .pa-woo-mc__subtotal-heading")
							.html(newTxt);
					}
				}
			}

			if (settings.removeTxt) {
				$scope.find(".pa-woo-mc__remove-item span").text(settings.removeTxt);
			}

			if (settings.crossSellTxt) {
				$scope
					.find(".pa-woo-mc__cross-sells-heading")
					.text(settings.crossSellTxt);
			}

			if (settings.taxLabel) {
				appendTaxLabel(settings.taxLabel);
			}

			// updating the progressbar.
			if ($scope.find(".pa-woo-mc__progressbar-wrapper").length) {
				var subtotal = parseFloat(
						$scope
							.find(
								".pa-woo-mc__progressbar-wrapper .pa-woo-mc__subtotal-placeholder",
							)
							.text(),
					),
					progressTxt = $scope
						.find(".pa-woo-mc__progressbar-wrapper")
						.data("pa-progress-txt"),
					freeShippingThreshold = parseFloat(
						$scope
							.find(".pa-woo-mc__progressbar-wrapper")
							.data("pa-progress-threshold"),
					),
					progressVal = parseFloat(
						((subtotal / freeShippingThreshold) * 100).toFixed(2),
					),
					completeTxt = $scope
						.find(".pa-woo-mc__progressbar-wrapper")
						.data("pa-progress-complete");

				// Ensure progress value is between [0 - 100]
				if (progressVal > 100) {
					progressVal = 100;
				} else if (progressVal < 0) {
					progressVal = 0;
				}

				// Update the progress bar fill width
				$scope
					.find(".pa-woo-mc__progressbar-fill")
					.css("width", progressVal + "%");
				$scope
					.find(".pa-woo-mc__progressbar")
					.attr("aria-valuenow", progressVal);

				// update its message if the purchase threshold is met.
				if (subtotal >= freeShippingThreshold && completeTxt) {
					$scope.find(".pa-woo-mc__progress-heading").html(completeTxt);
				} else {
					$scope.find(".pa-woo-mc__progress-heading").html(progressTxt);
				}
			}
		}

		/** Adds Cart Items' Events.
		 * Updating the item quantity, or deleting it.
		 */
		function initCartContentEvents() {
			$scope
				.find(".pa-woo-mc__qty-btn")
				.off("click.paQtyBtn")
				.on("click.paQtyBtn", function (e) {
					e.stopPropagation();

					var $input = $(this).parent().find(".pa-woo-mc__input")[0],
						allowBackorders = $scope.hasClass("pa-allow-bkorders-yes"),
						itemStock = parseInt($($input).attr("max")),
						currentVal = parseInt($($input).val());

					if ($(this).hasClass("plus")) {
						// backorders allowed || current value less than max stock.
						// we check if item stock is NAN, to cover the case where no stock is specified for a product.
						if (allowBackorders || currentVal < itemStock || isNaN(itemStock)) {
							if (allowBackorders) {
								$($input).removeAttr("max");
							}

							$input.stepUp();
							$($input).trigger("change");
						} else {
							$(this)
								.parents(".pa-woo-mc__item-wrapper")
								.find(".pa-woo-mc__item-notice")
								.text(PAWooMCartSettings.stock_msg + itemStock);
						}
					} else {
						$input.stepDown();
						$($input).trigger("change");
					}
				});

			// update item quantity.
			$scope
				.find(".pa-woo-mc__input")
				.off("change.paQtyInput")
				.on("change.paQtyInput", function () {
					var itemKey = $(this).attr("name").replace("cart-", ""),
						newQty = $(this).val();

					if ("1" === newQty) {
						$(this).siblings(".pa-woo-mc__qty-btn.minus").addClass("disabled");
					} else {
						$(this)
							.siblings(".pa-woo-mc__qty-btn.minus")
							.removeClass("disabled");
					}

					sendCartAjax("pa_update_mc_qty", itemKey, newQty);
				});

			// delete cart item.
			$scope
				.find(".pa-woo-mc__remove-item")
				.off("click.paRemoveCartItem")
				.on("click.paRemoveCartItem", function (e) {
					e.stopPropagation();
					var itemKey = $(this).data("pa-item-key").replace("cart-", "");
					sendCartAjax("pa_delete_cart_item", itemKey, false);
				});

			$scope
				.find(".pa-woo-mc__input")
				.off("click.paQtyInputClick")
				.on("click.paQtyInputClick", function (e) {
					e.stopPropagation();
				});
		}

		/**
		 * Sends an ajax request to update/delete a cart item.
		 *
		 * @param {String} action Request action.
		 * @param {String} itemKey Items's key.
		 * @param {Boolean|String} qty false|item quantity.
		 */
		function sendCartAjax(action, itemKey, extraData) {
			var data = {
				action: action,
				nonce: PAWooMCartSettings.mini_cart_nonce,
			};

			switch (action) {
				case "pa_update_mc_qty":
					if (!extraData) {
						return;
					}

					data.itemKey = itemKey;
					data.quantity = extraData;
					break;

				case "pa_delete_cart_item":
					data.itemKey = itemKey;
					break;

				case "pa_apply_coupon":
				case "pa_remove_coupon":
					data.couponCode = extraData;
					break;
			}

			var $removeLink = $scope.find(".pa-woo-mc__remove-coupon");

			$.ajax({
				url: PAWooMCartSettings.ajaxurl,
				dataType: "JSON",
				type: "POST",
				data: data,
				beforeSend: function () {
					$scope
						.find(".pa-woo-mc__widget-shopping-outer-wrapper")
						.append(
							'<div class="premium-loading-feed"><div class="premium-loader"></div></div>',
						);
				},
				success: function (res) {
					$(document.body).trigger("wc_fragment_refresh");

					if ("pa_apply_coupon" === action) {
						$scope
							.find(".pa-woo-mc__coupon-notice")
							.removeClass("pa-error-notice")
							.text(res.data);
						$removeLink.css("display", "inline-block");
					}

					if ("pa_remove_coupon" === action) {
						$removeLink.hide();
						$scope.find(".pa-woo-mc__coupon-field").val("");
						$scope
							.find(".pa-woo-mc__coupon-notice")
							.removeClass("pa-error-notice")
							.text("");
					}
				},
				error: function (err) {
					console.log(err);

					var status = err.status;

					if ("pa_apply_coupon" === action) {
						$scope
							.find(".pa-woo-mc__coupon-notice")
							.addClass("pa-error-notice")
							.text(err.responseJSON.data);

						if (status === 409) {
							$removeLink.css("display", "inline-block");
						} else {
							$removeLink.hide();
						}
					}
				},
				complete: function (res) {
					$scope.find(".premium-loading-feed").remove();
				},
			});
		}

		/** Add the widget's basic events, doesn't need to be re-added on cart fragments refresh */
		function initWidgetEvents() {
			if ("click" === triggerEvent) {
				$scope
					.find(".pa-woo-mc__inner-container")
					.on("click.paToggleMiniCart", toggleMiniCart);
			} else {
				// hover => mini window.
				$scope
					.find(".pa-woo-mc__inner-container")
					.on("mouseenter.paToggleMiniCart", toggleMiniCart);

				$scope.on("mouseleave.paToggleMiniCart", function () {
					$scope.data(
						"paMcCloseTimer",
						setTimeout(function () {
							$scope
								.find(".pa-woo-mc__content-wrapper-" + id)
								.removeClass("pa-woo-mc__open");
						}, 300),
					);
				});
			}

			// remove all btn.
			$scope
				.find(".pa-woo-mc__remove-all-btn")
				.on("click.paConfirm", function () {
					$(this).hide();
					$scope.find(".pa-woo-mc__empty-mc-confirm").css("display", "flex");
				});

			$scope.find(".pa-woo-mc__confirm-btn").on("click.paEmptyMC", function () {
				if ($(this).hasClass("pa-empty-mc")) {
					sendCartAjax("pa_delete_cart_items", false, false);
				}

				// show the main message anyway.
				$scope.find(".pa-woo-mc__remove-all-btn").show();
				$scope.find(".pa-woo-mc__empty-mc-confirm").hide();
			});

			// apply coupon.
			$scope.find(".pa-woo-mc__coupon-submit").on("click", function () {
				var couponCode = $scope.find(".pa-woo-mc__coupon-field").val();

				if (couponCode) {
					sendCartAjax("pa_apply_coupon", false, couponCode);
				}
			});

			// remove coupon.
			$scope
				.find(".pa-woo-mc__remove-coupon")
				.on("click.paRemoveCoupon", function (e) {
					e.preventDefault();
					var couponCode = $scope.find(".pa-woo-mc__coupon-field").val();

					if (couponCode) {
						sendCartAjax("pa_remove_coupon", false, couponCode);
					}
				});

			//On Click outside, close everything.
			$("body").off("click.paCloseMC");
			if (settings.clickOutside) {
				$("body").on("click.paCloseMC", function (event) {
					var mcContent =
						".premium-tabs-nav-list-item, .pa-woo-mc__content-wrapper, .pa-woo-mc__content-wrapper *, .pa-woo-mc__inner-container, .pa-woo-mc__inner-container *";

					if (!$(event.target).is(mcContent)) {
						if ("menu" !== type) {
							// $(".pa-woo-mc__overlay-" + id).addClass("premium-addons__v-hidden");
							$(".pa-woo-mc__overlay").addClass("premium-addons__v-hidden");
						}

						// $scope.find('.pa-woo-mc__content-wrapper-' + id).removeClass('pa-woo-mc__open');
						$(".pa-woo-mc__content-wrapper").removeClass("pa-woo-mc__open");
					}
				});
			}

			// Prevent clicks inside the cart dropdown from bubbling to body and closing the cart.
			$scope
				.find(".pa-woo-mc__content-wrapper-" + id)
				.on("click.paStopPropagation", function (e) {
					e.stopPropagation();
				});

			/**
			 * Events: Closing the slide menu.
			 */
			$scope.find(".pa-woo-mc__close-button").on("click", function () {
				$(".pa-woo-mc__overlay-" + id).addClass("premium-addons__v-hidden");
				$scope
					.find(".pa-woo-mc__content-wrapper-" + id)
					.removeClass("pa-woo-mc__open");
			});

			// coupon toggler.
			if (settings.coupon) {
				$scope.find(".pa-woo-mc__coupon-toggler").click(function () {
					if ($scope.find(".pa-woo-mc__coupon-wrapper").is(":visible")) {
						$scope.find(".pa-woo-mc__coupon-wrapper").slideUp();
					} else {
						$scope.find(".pa-woo-mc__coupon-wrapper").slideDown();
					}
				});
			}
		}
	};

	$(window).on("elementor/frontend/init", function () {
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/premium-mini-cart.default",
			PremiumMiniCartHandler,
		);
	});
})(jQuery);
