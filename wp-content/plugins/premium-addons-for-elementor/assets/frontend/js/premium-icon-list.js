(function ($) {
	$(window).on("elementor/frontend/init", function () {
		var PremiumBulletListHandler =
			elementorModules.frontend.handlers.Base.extend({
				getDefaultSettings: function () {
					return {
						selectors: {
							listItems: ".premium-bullet-list-box",
							items: ".premium-bullet-list-content",
						},
					};
				},

				getDefaultElements: function () {
					var selectors = this.getSettings("selectors"),
						elements = {
							$listItems: this.$element.find(selectors.listItems),
							$items: this.$element.find(selectors.items),
						};

					return elements;
				},

				bindEvents: function () {
					this.run();

					this.addRandomBadges();

					var self = this;
					var settings = this.getElementSettings();

					if (
						!this.$element.is(":visible") &&
						this.$element.closest(".premium-mega-nav-item").length > 0
					)
						this.$element
							.closest(".premium-mega-nav-item")
							.find(".premium-menu-link")
							.on("click", function () {
								self.addRandomBadges();
							});

					$(window).on("resize.paHandleAlignment", self.handleAlignment);

					if (
						!this.elements.$listItems.data("list-animation") &&
						settings.show_connector === "yes"
					) {
						// Update connectors on load
						setTimeout(function () {
							self.updateBulletConnectors();
						}, 100);

						// observe items size.
						if (typeof ResizeObserver !== "undefined") {
							self.paResizeObserver = new ResizeObserver(() => {
								self.updateBulletConnectors();
							});

							// Observe all relevant items
							self.elements.$items.each(function () {
								self.paResizeObserver.observe(this);
							});
						}
					}
				},
				unbindEvents: function () {
					if (this.paResizeObserver) {
						this.paResizeObserver.disconnect();
						this.paResizeObserver = null;
					}
					$(window).off("resize.paHandleAlignment", this.handleAlignment);
				},
				run: function () {
					this.handleAlignment();

					var $listItems = this.elements.$listItems,
						$items = this.elements.$items,
						$scope = this.$element;

					var devices = [
						"widescreen",
						"desktop",
						"laptop",
						"tablet",
						"tablet_extra",
						"mobile",
						"mobile_extra",
					].filter(function (ele) {
						return ele != elementorFrontend.getCurrentDeviceMode();
					});

					devices.map(function (device) {
						device = "desktop" !== device ? device + "-" : "";
						$scope.removeClass(function (index, selector) {
							return (
								selector.match(
									new RegExp("(^|\\s)premium-" + device + "type\\S+", "g"),
								) || []
							).join(" ");
						});
					});

					var typeRow = $scope.filter('*[class*="type-row"]');

					if (typeRow.length > 0) {
						$items.addClass("premium-bullet-list-content-inline");
					}

					var eleObserver = new IntersectionObserver(function (entries) {
						entries.forEach(function (entry) {
							if (entry.isIntersecting) {
								var element = $(entry.target),
									delay = element.data("delay");

								setTimeout(function () {
									element
										.next(
											".premium-bullet-list-divider , .premium-bullet-list-divider-inline",
										)
										.css("opacity", "1");
									element
										.next(
											".premium-bullet-list-divider-inline , .premium-bullet-list-divider",
										)
										.addClass("animated " + $listItems.data("list-animation"));

									element
										.css("opacity", "1")
										.addClass("animated " + $listItems.data("list-animation"));
								}, delay);

								eleObserver.unobserve(entry.target); // to only execute the callback func once.
							}
						});
					});

					$items.each(function (index, item) {
						if (
							$listItems.data("list-animation") &&
							" " != $listItems.data("list-animation")
						) {
							eleObserver.observe($(item)[0]); // we need to apply this on each item
						}
					});
				},

				handleAlignment: function () {
					var $element = this.$element,
						computedStyle = getComputedStyle($element[0]),
						listAlignment = computedStyle.getPropertyValue("--pa-bullet-align");

					$element.addClass("premium-bullet-list-" + listAlignment);

					if ("flex-end" === listAlignment) {
						$element
							.find(".pa-has-text-bullet:not(.premium-bullet-list-wrapper-top)")
							.css("transform-origin", "right");
					}
				},

				addRandomBadges: function () {
					var settings = this.getElementSettings();

					if (settings.rbadges_repeater.length < 1) return;

					var $currentList = $(
						".elementor-element-" + this.$element.data("id"),
					);

					if (
						!$currentList.is(":visible") ||
						this.$element.hasClass("randomb-applied")
					)
						return;

					var randomBadges = settings.rbadges_repeater;

					randomBadges.forEach(function (badge, index) {
						if ("" != badge.rbadge_selector) {
							var notBadgedItems = $(badge.rbadge_selector)
								.find(".premium-bullet-list-text")
								.filter(":not(:has(+ .premium-bullet-list-badge))");

							var $badge = $("<div>", {
								class:
									"premium-bullet-list-badge elementor-repeater-item-" +
									badge._id,
							}).append($("<span>").html(badge.badge_title));

							var numOfApplies =
								Math.floor(
									Math.random() * (badge.rbadge_max - badge.rbadge_min + 1),
								) + badge.rbadge_min;

							// Get a random number of elements from the list.
							for (var i = 0; i < numOfApplies; i++) {
								// notBadgedItems = $(badge.rbadge_selector).find('.premium-bullet-list-text').filter(':not(:has(+ .premium-bullet-list-badge))');

								var randomIndex = Math.floor(
										Math.random() * notBadgedItems.length,
									),
									wasBadgedBefore =
										$(notBadgedItems[randomIndex]).siblings(
											".premium-bullet-list-badge",
										).length > 0;

								if (!wasBadgedBefore) {
									$(notBadgedItems[randomIndex]).after($badge.clone());
								}
							}
						}
					});

					this.$element.addClass("randomb-applied");
				},

				updateBulletConnectors: function () {
					const elements = this.elements;

					if (!elements || !elements.$items || !elements.$items.length) {
						return;
					}

					elements.$items.each((index, item) => {
						const wrapper = item.querySelector(".premium-bullet-list-wrapper");
						const nextItem = elements.$items[index + 1];

						// last item || no bullet list.
						if (!wrapper || !nextItem) {
							if (wrapper) {
								wrapper.style.setProperty("--pa-connector-height", "0px");
							}
							return;
						}

						const nextWrapper = nextItem.querySelector(
							".premium-bullet-list-wrapper",
						);

						if (!nextWrapper) {
							wrapper.style.setProperty("--pa-connector-height", "0px");
							return;
						}

						const currentRect = wrapper.getBoundingClientRect();
						const nextRect = nextWrapper.getBoundingClientRect();

						// Distance from bottom of current icon to top of next icon
						const height = Math.max(0, nextRect.top - currentRect.bottom);

						wrapper.style.setProperty("--pa-connector-height", `${height}px`);
					});
				},
			});

		elementorFrontend.elementsHandler.attachHandler(
			"premium-icon-list",
			PremiumBulletListHandler,
		);
	});
})(jQuery);
