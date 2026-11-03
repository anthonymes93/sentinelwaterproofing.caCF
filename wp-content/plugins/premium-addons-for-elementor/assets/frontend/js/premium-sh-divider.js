(function ($) {
	var WAVE_PATHS = [
		"M0,192L16,202.7C32,213,64,235,96,250.7C128,267,160,277,192,277.3C224,277,256,267,288,229.3C320,192,352,128,384,106.7C416,85,448,107,480,122.7C512,139,544,149,576,144C608,139,640,117,672,101.3C704,85,736,75,768,101.3C800,128,832,192,864,192C896,192,928,128,960,128C992,128,1024,192,1056,208C1088,224,1120,192,1152,154.7C1184,117,1216,75,1248,96C1280,117,1312,203,1344,208C1376,213,1408,139,1424,101.3L1440,64L1440,320L1424,320C1408,320,1376,320,1344,320C1312,320,1280,320,1248,320C1216,320,1184,320,1152,320C1120,320,1088,320,1056,320C1024,320,992,320,960,320C928,320,896,320,864,320C832,320,800,320,768,320C736,320,704,320,672,320C640,320,608,320,576,320C544,320,512,320,480,320C448,320,416,320,384,320C352,320,320,320,288,320C256,320,224,320,192,320C160,320,128,320,96,320C64,320,32,320,16,320L0,320Z",
		"M0,288L16,261.3C32,235,64,181,96,160C128,139,160,149,192,160C224,171,256,181,288,208C320,235,352,277,384,261.3C416,245,448,171,480,149.3C512,128,544,160,576,170.7C608,181,640,171,672,186.7C704,203,736,245,768,234.7C800,224,832,160,864,128C896,96,928,96,960,96C992,96,1024,96,1056,133.3C1088,171,1120,245,1152,240C1184,235,1216,149,1248,138.7C1280,128,1312,192,1344,218.7C1376,245,1408,235,1424,229.3L1440,224L1440,320L1424,320C1408,320,1376,320,1344,320C1312,320,1280,320,1248,320C1216,320,1184,320,1152,320C1120,320,1088,320,1056,320C1024,320,992,320,960,320C928,320,896,320,864,320C832,320,800,320,768,320C736,320,704,320,672,320C640,320,608,320,576,320C544,320,512,320,480,320C448,320,416,320,384,320C352,320,320,320,288,320C256,320,224,320,192,320C160,320,128,320,96,320C64,320,32,320,16,320L0,320Z",
		"M0,224L16,192C32,160,64,96,96,96C128,96,160,160,192,197.3C224,235,256,245,288,224C320,203,352,149,384,149.3C416,149,448,203,480,197.3C512,192,544,128,576,96C608,64,640,64,672,85.3C704,107,736,149,768,144C800,139,832,85,864,101.3C896,117,928,203,960,213.3C992,224,1024,160,1056,154.7C1088,149,1120,203,1152,192C1184,181,1216,107,1248,69.3C1280,32,1312,32,1344,69.3C1376,107,1408,181,1424,218.7L1440,256L1440,320L1424,320C1408,320,1376,320,1344,320C1312,320,1280,320,1248,320C1216,320,1184,320,1152,320C1120,320,1088,320,1056,320C1024,320,992,320,960,320C928,320,896,320,864,320C832,320,800,320,768,320C736,320,704,320,672,320C640,320,608,320,576,320C544,320,512,320,480,320C448,320,416,320,384,320C352,320,320,320,288,320C256,320,224,320,192,320C160,320,128,320,96,320C64,320,32,320,16,320L0,320Z",
	];

	var POSITION_CLASSES =
		"premium-shape-divider__top premium-shape-divider__bottom premium-shape-divider__right premium-shape-divider__left";

	var RESIZE_DEBOUNCE_MS = 100;

	$(window).on("elementor/frontend/init", function () {
		var PremiumShapeDivider = elementorModules.frontend.handlers.Base.extend({
			// Every Base.extend() handler shares the 'child' ID, so in the editor another handler on the same element would call our onDestroy().
			getConstructorID: function () {
				return "PremiumShapeDivider";
			},

			// Base sets $element, editor listeners and events only when this returns true.
			isActive: function (settings) {
				return settings.$element.hasClass("premium-shape-divider-yes");
			},

			getDefaultElements: function () {
				var id = this.$element.data("id");

				return {
					$fill: $("#premium-shape-divider-fill-" + id),
					$divider: $("#premium-shape-divider-" + id),
				};
			},

			getDividerSvg: function () {
				return this.elements.$divider.find("svg");
			},

			bindEvents: function () {
				this.onWindowResize = elementorFrontend.debounce(
					this.onWindowResize.bind(this),
					RESIZE_DEBOUNCE_MS,
				);

				elementorFrontend.elements.$window.on("resize", this.onWindowResize);
			},

			unbindEvents: function () {
				elementorFrontend.elements.$window.off("resize", this.onWindowResize);
			},

			onInit: function () {
				elementorModules.frontend.handlers.Base.prototype.onInit.apply(
					this,
					arguments,
				);

				if (!this.isActive(this.getSettings())) return;

				if (this.elements.$fill.length) {
					this.setCustomFill();
				}

				if (elementorFrontend.isEditMode()) {
					var selectedShape = this.elements.$divider.data("shape");

					if (selectedShape) this.renderShapeSVG(selectedShape);
				} else {
					this.$element.append(this.elements.$fill, this.elements.$divider);
				}

				this.updateShapePosition();
				this.updateShapeSize();

				this.elements.$divider.css({
					visibility: "inherit",
					opacity: "inherit",
				});

				this.checkWaveAnimation();

				if (this.$element.hasClass("premium-shape-divider__custom")) {
					this.getDividerSvg().attr("preserveAspectRatio", "none");
				}

				if (this.isEdit) {
					this.watchEditorSettings();
				}
			},

			onDestroy: function () {
				// The classes set from the position CSS var would outlive the divider if it gets disabled in the editor.
				// Inactive instances have no $element.
				if (this.$element) {
					this.$element.removeClass(POSITION_CLASSES);
				}

				if (this.settingsModel) {
					this.settingsModel.off("change", this.onSettingsChange);
				}

				elementorModules.frontend.handlers.Base.prototype.onDestroy.apply(
					this,
					arguments,
				);
			},

			onWindowResize: function () {
				this.onPositionChange();
			},

			onPositionChange: function () {
				this.updateShapePosition();
				this.updateShapeSize();
			},

			// Position and Animate don't re-render the element in the editor.
			// onElementChange only fires for panel edits, so undo/redo would leave the divider stale.
			watchEditorSettings: function () {
				this.settingsModel =
					elementorFrontend.config.elements.data[this.getModelCID()];

				this.onSettingsChange = this.onSettingsChange.bind(this);

				this.settingsModel.on("change", this.onSettingsChange);
			},

			onSettingsChange: function (settingsModel) {
				var changed = Object.keys(settingsModel.changed);

				var positionChanged = changed.some(function (name) {
					return 0 === name.indexOf("premium_gdivider_pos");
				});

				if (positionChanged) {
					// Elementor writes the new --pa-sh-divider-pos only after the change event.
					setTimeout(this.onPositionChange.bind(this));
				}

				if (
					-1 !== changed.indexOf("premium_gdivider_animate") &&
					this.$element.hasClass("premium-shape22")
				) {
					// anime.js rewrites the wave's path, so the original SVG must be fetched again.
					anime.remove(this.getDividerSvg().children("path").toArray());
					this.renderShapeSVG(22);
				}
			},

			setCustomFill: function () {
				this.elements.$fill.attr(
					"viewBox",
					this.getDividerSvg().attr("viewBox"),
				);

				this.getDividerSvg().attr(
					"fill",
					"url(#pa-shape-divider-fill-" + this.$element.data("id") + ")",
				);
			},

			updateShapePosition: function () {
				var shapePos = getComputedStyle(this.$element[0]).getPropertyValue(
					"--pa-sh-divider-pos",
				);

				this.$element
					.removeClass(POSITION_CLASSES)
					.addClass("premium-shape-divider__" + shapePos);
			},

			updateShapeSize: function () {
				var $svg = this.getDividerSvg(),
					isRight = this.$element.hasClass("premium-shape-divider__right");

				// In the editor the SVG arrives over AJAX after init.
				if (!$svg.length) return;

				if (
					!isRight &&
					!this.$element.hasClass("premium-shape-divider__left")
				) {
					$svg.attr("style", "");
					return;
				}

				var containerHeight = this.$element.outerHeight() + "px";

				$svg.css({
					transform: isRight
						? "rotate(-90deg) translate(0,-100%)"
						: "rotate(90deg) translate(0,-100%)",
					width: containerHeight,
				});

				$svg[0].style.setProperty("--premium-shape-divider-h", containerHeight);
			},

			renderShapeSVG: function (shapeIndex) {
				var _this = this;

				$.ajax({
					type: "POST",
					url: PaShapeDividerSettings.ajaxurl,
					data: {
						action: "get_shape_divider_svg",
						shape: "shape" + shapeIndex,
						nonce: PaShapeDividerSettings.nonce,
					},
				}).success(function (response) {
					if (response.data.shape) {
						_this.elements.$divider.html(response.data.shape);

						if (_this.elements.$fill.length) {
							_this.setCustomFill();
						}

						_this.checkWaveAnimation();
					}
				});
			},

			checkWaveAnimation: function () {
				var hasWaveAnime =
					this.$element.hasClass("premium-shape-divider-anime-yes") &&
					this.$element.hasClass("premium-shape22");

				if (!hasWaveAnime) return;

				var $paths = this.getDividerSvg().children("path");

				this.getDividerSvg().attr("viewBox", "0 0 1440 320");
				$paths.attr("d", WAVE_PATHS[0]);

				anime({
					targets: $paths.toArray(),
					loop: true,
					direction: "alternate",
					easing: "linear",
					duration: 7500,
					d: [
						{ value: WAVE_PATHS[1] },
						{ value: WAVE_PATHS[2] },
						{ value: WAVE_PATHS[0] },
					],
				});
			},
		});

		["section", "column", "container"].forEach(function (elementType) {
			elementorFrontend.hooks.addAction(
				"frontend/element_ready/" + elementType,
				function ($scope) {
					elementorFrontend.elementsHandler.addHandler(PremiumShapeDivider, {
						$element: $scope,
					});
				},
			);
		});
	});
})(jQuery);
