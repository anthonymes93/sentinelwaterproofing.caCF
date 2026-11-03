(function ($) {
	var THROWABLE = {
		dragThresholdPx: 5,
		rainStaggerMs: 80,
		topWallFallbackMs: 4000,
		resizeDebounceMs: 250,
		topWallTriggerY: 70,
		wallThickness: 500,
		spawnGapPx: 10,
		mouseStiffness: 0.1,
		tiltRangeRad: 0.2 * Math.PI,
		scrollGravityFactor: 0.1,
		scrollGravityMin: -2,
		scrollGravityMax: 4,
	};

	$(window).on("elementor/frontend/init", function () {
		var PremiumTermsCloud = elementorModules.frontend.handlers.Base.extend({
			getDefaultSettings: function () {
				return {
					selectors: {
						container: ".premium-tcloud-container",
						canvas: ".premium-tcloud-canvas",
						termWrap: ".premium-tcloud-term",
						scene: ".premium-tcloud-canvas-container",
						termOuter: ".premium-tcloud-term-wrap",
						termLink: ".premium-tcloud-term-link",
					},
				};
			},

			getDefaultElements: function () {
				var selectors = this.getSettings("selectors");

				return {
					$container: this.$element.find(selectors.container),
					$canvas: this.$element.find(selectors.canvas),
					$termWrap: this.$element.find(selectors.termWrap),
					$scene: this.$element.find(selectors.scene),
					$termOuter: this.$element.find(selectors.termOuter),
				};
			},

			bindEvents: function () {
				this.run();
			},

			run: function () {
				var widgetSettings = this.getElementSettings(),
					$container = this.elements.$container,
					_this = this,
					$canvas = this.elements.$canvas;

				if (["shape", "sphere"].includes(widgetSettings.words_order)) {
					var computedStyle = getComputedStyle($canvas[0]);

					$canvas.attr({
						width: computedStyle.getPropertyValue("--pa-tcloud-width"),
						height: computedStyle.getPropertyValue("--pa-tcloud-height"),
					});
				}

				_this.runTimer = setTimeout(function () {
					if ("shape" === widgetSettings.words_order) {
						// elementorFrontend.waypoint($canvas, function () {
						//     _this.renderWordCloud();
						// });
						// Using IntersectionObserverAPI.
						var eleObserver = new IntersectionObserver(function (entries) {
							entries.forEach(function (entry) {
								if (entry.isIntersecting) {
									_this.renderWordCloud();
									eleObserver.unobserve(entry.target); // to only execute the callback func once.
								}
							});
						});

						eleObserver.observe($canvas[0]);
					} else if ("sphere" === widgetSettings.words_order) {
						_this.renderWordSphere();
					} else {
						_this.handleTermsGrid();
						_this.maybeInitThrowable();
					}

					$container.removeClass("premium-tcloud-hidden");
				}, 500);
			},

			renderWordSphere: function () {
				var widgetID = this.getID(),
					widgetSettings = this.getElementSettings(),
					$termWrap = this.elements.$termWrap,
					_this = this;

				var colorScheme = widgetSettings.colors_select;

				if ("custom" === colorScheme && widgetSettings.words_colors) {
					var colors = widgetSettings.words_colors.split("\n");
				}

				$termWrap.map(function (index, term) {
					var generatedColor = null;

					if ("custom" !== colorScheme) {
						generatedColor = _this.genRandomColor(colorScheme);
					} else if (widgetSettings.words_colors) {
						generatedColor = Math.floor(Math.random() * colors.length);

						generatedColor = colors[generatedColor];
					}

					if (generatedColor)
						$(term)
							.find(".premium-tcloud-term-link")
							.css(
								("background" === widgetSettings.colors_target
									? "background-"
									: "") + "color",
								generatedColor,
							);
				});

				// tagcanvas navigates to the clicked tag's href; an empty href reloads the page.
				$termWrap.find("a:not([href])").on("click", function (event) {
					event.preventDefault();
				});

				setTimeout(function () {
					$("#premium-tcloud-canvas-" + widgetID).tagcanvas(
						{
							decel: "yes" === widgetSettings.stop_onDrag ? 0.95 : 1,

							overlap: false,
							textColour: null,

							weight: "yes" === widgetSettings.sphere_weight,
							weightFrom: "data-weight",
							weightSizeMin:
								"yes" === widgetSettings.sphere_weight
									? widgetSettings.weight_min.size
									: 10,
							weightSizeMax:
								"yes" === widgetSettings.sphere_weight
									? widgetSettings.weight_max.size
									: 20,

							textHeight: widgetSettings.text_height || 15,
							textFont: widgetSettings.font_family,
							textWeight: widgetSettings.font_weight,

							wheelZoom: "yes" === widgetSettings.wheel_zoom,
							reverse: "yes" === widgetSettings.reverse,
							dragControl: "yes" === widgetSettings.drag_control,
							initial: [
								widgetSettings.start_xspeed.size,
								widgetSettings.start_yspeed.size,
							],

							bgColour: "tag",

							padding:
								"background" === widgetSettings.colors_target
									? widgetSettings.sphere_term_padding.size
									: 0,
							bgRadius:
								"background" === widgetSettings.colors_target
									? widgetSettings.sphere_term_radius.size
									: 0,

							outlineColour: "rgba(2,2,2,0)",
							maxSpeed: 0.03,
							depth: 0.75,
						},
						"premium-tcloud-terms-container-" + widgetID,
					);
				}, 100);
			},

			handleTermsGrid: function () {
				var widgetSettings = this.getElementSettings(),
					$termWrap = this.elements.$termWrap,
					_this = this;

				var colorScheme = widgetSettings.colors_select;

				if ("custom" === colorScheme && widgetSettings.words_colors) {
					var colors = widgetSettings.words_colors.split("\n");
				}

				$termWrap.map(function (index, term) {
					var generatedColor = null,
						fontSize = $(term)
							.find(".premium-tcloud-term-link")
							.css("font-size")
							.replace("px", "");

					if (widgetSettings.fsize_scale.size > 0)
						fontSize =
							parseFloat(fontSize) +
							$(term).find(".premium-tcloud-term-link").data("weight") *
								widgetSettings.fsize_scale.size;

					if ("custom" !== colorScheme) {
						generatedColor = _this.genRandomColor(colorScheme, "grid");

						var opacities = {
							original: "random-light" === colorScheme ? "0.15)" : "80%)",
							replaced: "random-light" === colorScheme ? "0.3)" : "100%)",
						};

						$(term)
							.get(0)
							.style.setProperty(
								"--tag-hover-color",
								generatedColor.replace(opacities.original, opacities.replaced),
							);
						$(term)
							.get(0)
							.style.setProperty(
								"--tag-text-color",
								"random-dark" === colorScheme
									? "#fff"
									: generatedColor.replace("42%,0.15)", "35%,100%)"),
							);
					} else if (widgetSettings.words_colors) {
						generatedColor = Math.floor(Math.random() * colors.length);

						generatedColor = colors[generatedColor];

						$(term)
							.get(0)
							.style.setProperty("--tag-hover-color", generatedColor);
					}

					$(term).get(0).style.setProperty("--tag-color", generatedColor);

					if (widgetSettings.fsize_scale.size > 0)
						$(term)
							.find(".premium-tcloud-term-link")
							.css("font-size", Math.ceil(fontSize) + "px");

					if ("ribbon" === widgetSettings.words_order) {
						$(term)
							.get(0)
							.style.setProperty(
								"--tag-ribbon-size",
								Math.ceil($(term).outerHeight(false)) / 2 + "px",
							);
					}
				});
			},

			renderWordCloud: function () {
				var widgetID = this.getID(),
					widgetSettings = this.getElementSettings(),
					$container = this.elements.$container,
					settings = $container.data("chart");

				var wordsArr = settings.wordsArr,
					colors = [],
					rotationRatio = (rotationSteps = null),
					minRot = -90 * (Math.PI / 180),
					maxRot = 90 * (Math.PI / 180);

				switch (widgetSettings.rotation_select) {
					case "horizontal":
						rotationRatio = 0;
						rotationSteps = 0;
						break;

					case "vertical":
						rotationRatio = 1;
						rotationSteps = 2;
						break;

					case "hv":
						rotationRatio = 0.5;
						rotationSteps = 2;
						break;

					case "custom":
						rotationRatio = widgetSettings.rotation.size || 0.3;

						minRot = widgetSettings.degrees.size * (Math.PI / 180) || 45;
						maxRot = widgetSettings.degrees.size * (Math.PI / 180) || 45;

						break;

					case "random":
						rotationRatio = Math.random();
						rotationSteps = 0;

						break;

					default:
						rotationRatio = 0.3;
						break;
				}

				if ("custom" === widgetSettings.colors_select) {
					colors = widgetSettings.words_colors.split("\n");
				}

				WordCloud(
					document.getElementById("premium-tcloud-canvas-" + widgetID),
					{
						backgroundColor: "rgba(0, 0, 0, 0)",
						shuffle: false,

						list: wordsArr,
						shape: widgetSettings.shape,
						color: widgetSettings.colors_select,
						wordsColors: colors,

						wait: widgetSettings.interval.size * 1000 || 0,

						gridSize: widgetSettings.grid_size.size || 8,

						weightFactor: widgetSettings.weight_scale || 5,

						minRotation: minRot,
						maxRotation: maxRot,

						rotateRatio: rotationRatio,
						rotationSteps: rotationSteps,

						fontFamily: widgetSettings.font_family || "Arial",
						fontWeight: widgetSettings.font_weight,

						click: function (item) {
							if (elementorFrontend.isEditMode() || !item[2]) {
								return;
							}

							window.open(item[2], item[5]);
						},

						// minSize: 10
						// rotationSteps: 90
					},
				);
			},

			genRandomColor: function (scheme, shape) {
				var min = 50,
					max = 90;

				if ("random-dark" === scheme) {
					min = 10;
					max = 50;
				}

				var lightandOpacity =
					(Math.random() * (max - min) + min).toFixed() + "%, 100%";
				if (shape) {
					lightandOpacity =
						"42%," + ("random-dark" === scheme ? "80%" : "0.15");
				}

				return (
					"hsla(" +
					(Math.random() * 360).toFixed() +
					"," +
					"100%," +
					lightandOpacity +
					")"
				);
			},

			genRandomRotate: function () {
				return Math.floor(Math.random() * 361);
			},

			maybeInitThrowable: function () {
				var $container = this.elements.$container;

				if (!$container.hasClass("premium-tcloud-throwable")) {
					return;
				}

				if (this.canRunThrowable()) {
					this.initThrowable();
				} else {
					$container.removeClass("premium-tcloud-throwable");
				}
			},

			canRunThrowable: function () {
				return (
					"undefined" !== typeof Matter &&
					!window.matchMedia("(prefers-reduced-motion: reduce)").matches
				);
			},

			initThrowable: function () {
				var _this = this;

				this.throwable = {
					destroyed: false,
					running: false,
					rained: false,
					scrollGravityOn: false,
					built: false,
					scene: this.elements.$scene[0],
					timers: [],
					walls: {},
					items: [],
				};

				document.fonts.ready.then(function () {
					if (!_this.throwable || _this.throwable.destroyed) {
						return;
					}
					_this.bindThrowableVisibility();
				});
			},

			buildThrowableScene: function () {
				var state = this.throwable,
					settings = this.getElementSettings(),
					scene = state.scene;

				state.width = scene.offsetWidth;
				state.height = scene.offsetHeight;

				// A hidden container measures 0×0 and would give every body zero mass.
				if (!state.width || !state.height) {
					return;
				}

				state.baseGravity = settings.throwable_gravity.size;

				state.engine = Matter.Engine.create();
				state.engine.gravity.y = state.baseGravity;
				state.runner = Matter.Runner.create();

				this.createThrowableMouse();
				this.createThrowableWalls();
				this.createThrowableBodies(settings.throwable_bounce.size);

				Matter.Composite.add(state.engine.world, [
					state.mouseConstraint,
					state.walls.left,
					state.walls.right,
					state.walls.floor,
				]);

				this.bindThrowableTick();
				this.bindThrowableClickGuard();
				this.bindThrowableResize();

				state.built = true;
			},

			createThrowableMouse: function () {
				var state = this.throwable,
					scene = state.scene;

				state.mouse = Matter.Mouse.create(scene);
				scene.removeEventListener("wheel", state.mouse.mousewheel);
				scene.addEventListener("mouseleave", state.mouse.mouseup);

				state.mouseConstraint = Matter.MouseConstraint.create(state.engine, {
					mouse: state.mouse,
					constraint: {
						stiffness: THROWABLE.mouseStiffness,
						render: { visible: false },
					},
				});

				// Scene is pointer-events:none so clicks between terms reach the widget. During a drag it must catch the pointer itself.
				Matter.Events.on(state.mouseConstraint, "mousedown", function () {
					scene.style.pointerEvents = "auto";
				});
				Matter.Events.on(state.mouseConstraint, "mouseup", function () {
					scene.style.pointerEvents = "";
				});
			},

			createThrowableWall: function (x, y, width, height) {
				return Matter.Bodies.rectangle(x, y, width, height, { isStatic: true });
			},

			createThrowableWalls: function () {
				var state = this.throwable,
					thickness = THROWABLE.wallThickness,
					half = thickness / 2;

				state.walls.left = this.createThrowableWall(
					-half,
					state.height / 2,
					thickness,
					state.height * 4,
				);
				state.walls.right = this.createThrowableWall(
					state.width + half,
					state.height / 2,
					thickness,
					state.height * 4,
				);
				state.walls.floor = this.createThrowableWall(
					state.width / 2,
					state.height + half,
					state.width * 2,
					thickness,
				);
			},

			createThrowableTopWall: function () {
				var state = this.throwable,
					thickness = THROWABLE.wallThickness;

				state.walls.top = this.createThrowableWall(
					state.width / 2,
					-thickness / 2,
					state.width * 2,
					thickness,
				);
				Matter.Composite.add(state.engine.world, state.walls.top);

				state.lastScrollTop = window.pageYOffset;
				state.scrollGravityOn = true;
			},

			getTermCornerRadius: function (term, rect) {
				var radius = getComputedStyle(term).borderTopLeftRadius,
					value = parseFloat(radius) || 0;

				if (radius.indexOf("%") > -1) {
					value = (Math.min(rect.width, rect.height) * value) / 100;
				}

				return Math.min(value, rect.height / 2);
			},

			createThrowableBodies: function (bounciness) {
				var _this = this,
					state = this.throwable,
					selectors = this.getSettings("selectors");

				state.items = this.elements.$termOuter
					.toArray()
					.map(function (wrap, index) {
						var term = wrap.querySelector(selectors.termWrap),
							rect = wrap.getBoundingClientRect(),
							radius = _this.getTermCornerRadius(term, rect),
							options = {
								angle: Matter.Common.random(
									-THROWABLE.tiltRangeRad,
									THROWABLE.tiltRangeRad,
								),
								restitution: bounciness,
							},
							body;

						// Matter produces degenerate vertices for chamfer radius 0.
						if (radius > 0) {
							options.chamfer = { radius: radius };
						}

						// Native link drag would swallow mousemove and kill the throw.
						wrap.querySelector(selectors.termLink).draggable = false;

						body = Matter.Bodies.rectangle(
							Matter.Common.random(
								rect.width / 2,
								state.width - rect.width / 2,
							),
							-rect.height - index * (rect.height + THROWABLE.spawnGapPx),
							rect.width,
							rect.height,
							options,
						);

						// Matter 0.19+ only remembers the mass to restore when a body turns static after creation; a body created static can never be released.
						Matter.Body.setStatic(body, true);

						return { wrap: wrap, term: term, body: body };
					});

				Matter.Composite.add(
					state.engine.world,
					state.items.map(function (item) {
						return item.body;
					}),
				);
			},

			bindThrowableTick: function () {
				var _this = this,
					state = this.throwable;

				Matter.Events.on(state.runner, "afterTick", function () {
					state.items.forEach(function (item) {
						var position = item.body.position;
						item.wrap.style.transform =
							"translate(" +
							position.x.toFixed(1) +
							"px," +
							position.y.toFixed(1) +
							"px)";
						item.term.style.transform =
							"translate(-50%,-50%) rotate(" +
							item.body.angle.toFixed(3) +
							"rad)";
					});

					if (
						!state.walls.top &&
						state.rained &&
						_this.lastBodyEnteredScene()
					) {
						_this.createThrowableTopWall();
					}

					if (state.scrollGravityOn) {
						_this.applyScrollGravity();
					}
				});
			},

			lastBodyEnteredScene: function () {
				var items = this.throwable.items;

				return (
					items.length > 0 &&
					items[items.length - 1].body.position.y > THROWABLE.topWallTriggerY
				);
			},

			applyScrollGravity: function () {
				var state = this.throwable,
					scrollTop = window.pageYOffset,
					delta = scrollTop - state.lastScrollTop;

				state.engine.gravity.y =
					state.baseGravity -
					Matter.Common.clamp(
						delta * THROWABLE.scrollGravityFactor,
						THROWABLE.scrollGravityMin,
						THROWABLE.scrollGravityMax,
					);
				state.lastScrollTop = scrollTop;
			},

			startThrowableRain: function () {
				var _this = this,
					state = this.throwable;

				state.rained = true;

				state.items.forEach(function (item, index) {
					item.wrap.style.opacity = 1;
					state.timers.push(
						setTimeout(function () {
							Matter.Body.setStatic(item.body, false);
						}, index * THROWABLE.rainStaggerMs),
					);
				});

				// Low gravity or a tall pile can keep the last body above the trigger line forever.
				state.timers.push(
					setTimeout(
						function () {
							if (!state.walls.top) {
								_this.createThrowableTopWall();
							}
						},
						state.items.length * THROWABLE.rainStaggerMs +
							THROWABLE.topWallFallbackMs,
					),
				);
			},

			bindThrowableVisibility: function () {
				var _this = this,
					state = this.throwable;

				state.visibilityObserver = new IntersectionObserver(function (entries) {
					var entry = entries[entries.length - 1];

					if (entry.isIntersecting) {
						_this.resumeThrowable();
					} else {
						_this.pauseThrowable();
					}
				});

				state.visibilityObserver.observe(state.scene);
			},

			resumeThrowable: function () {
				var state = this.throwable;

				if (!state.built) {
					this.buildThrowableScene();
				}

				if (!state.built) {
					return;
				}

				if (state.running) {
					return;
				}

				state.lastScrollTop = window.pageYOffset;
				Matter.Runner.run(state.runner, state.engine);
				state.running = true;

				if (!state.rained) {
					this.startThrowableRain();
				}
			},

			pauseThrowable: function () {
				var state = this.throwable;

				if (!state.running) {
					return;
				}

				Matter.Runner.stop(state.runner);
				state.running = false;
			},

			bindThrowableClickGuard: function () {
				var state = this.throwable,
					selectors = this.getSettings("selectors"),
					pressPoint = null,
					dragged = false;

				// Elementor's editor makes the whole widget natively draggable; a default mousedown on a term starts that drag instead of the physics one.
				state.onMouseDown = function (event) {
					if (event.target.closest(selectors.termLink)) {
						event.preventDefault();
					}
				};

				state.onPointerDown = function (event) {
					pressPoint = { x: event.clientX, y: event.clientY };
					dragged = false;
				};

				state.onPointerUp = function (event) {
					if (!pressPoint) {
						return;
					}

					dragged =
						Math.hypot(
							event.clientX - pressPoint.x,
							event.clientY - pressPoint.y,
						) > THROWABLE.dragThresholdPx;
					pressPoint = null;

					// Matter cancels touchstart, which suppresses the compatibility click; re-dispatch it for a tap.
					if ("touch" === event.pointerType && !dragged) {
						var link = event.target.closest(selectors.termLink);

						if (link) {
							link.click();
						}
					}
				};

				state.onPointerCancel = function () {
					pressPoint = null;
					dragged = false;
				};

				// pointerup runs before click, so the drag verdict must outlive pressPoint.
				state.onClick = function (event) {
					if (0 === event.detail) {
						return;
					}

					if (dragged) {
						event.preventDefault();
					}

					dragged = false;
				};

				state.scene.addEventListener("mousedown", state.onMouseDown, true);
				state.scene.addEventListener("pointerdown", state.onPointerDown, true);
				state.scene.addEventListener("pointerup", state.onPointerUp, true);
				state.scene.addEventListener(
					"pointercancel",
					state.onPointerCancel,
					true,
				);
				state.scene.addEventListener("click", state.onClick, true);
			},

			bindThrowableResize: function () {
				var _this = this,
					state = this.throwable;

				state.resizeObserver = new ResizeObserver(function () {
					clearTimeout(state.resizeTimer);
					state.resizeTimer = setTimeout(function () {
						_this.refreshThrowable();
					}, THROWABLE.resizeDebounceMs);
				});

				state.resizeObserver.observe(state.scene);
			},

			refreshThrowable: function () {
				var _this = this,
					state = this.throwable,
					width = state.scene.offsetWidth,
					height = state.scene.offsetHeight,
					oldWalls = [state.walls.left, state.walls.right, state.walls.floor];

				if (
					!width ||
					!height ||
					(width === state.width && height === state.height)
				) {
					return;
				}

				state.width = width;
				state.height = height;

				if (state.walls.top) {
					oldWalls.push(state.walls.top);
				}

				Matter.Composite.remove(state.engine.world, oldWalls);
				this.createThrowableWalls();
				Matter.Composite.add(state.engine.world, [
					state.walls.left,
					state.walls.right,
					state.walls.floor,
				]);

				if (state.walls.top) {
					this.createThrowableTopWall();
				}

				state.items.forEach(function (item) {
					_this.refreshThrowableBody(item);
				});
			},

			refreshThrowableBody: function (item) {
				var state = this.throwable,
					body = item.body,
					rect = item.wrap.getBoundingClientRect(),
					radius = this.getTermCornerRadius(item.term, rect),
					options = { angle: body.angle };

				if (radius > 0) {
					options.chamfer = { radius: radius };
				}

				Matter.Body.setVertices(
					body,
					Matter.Bodies.rectangle(
						body.position.x,
						body.position.y,
						rect.width,
						rect.height,
						options,
					).vertices,
				);

				if (body.position.x > state.width || body.position.x < 0) {
					Matter.Body.setPosition(body, {
						x: Matter.Common.random(
							rect.width / 2,
							state.width - rect.width / 2,
						),
						y: body.position.y,
					});
				}

				if (body.position.y > state.height) {
					Matter.Body.setPosition(body, {
						x: body.position.x,
						y: state.height / 2,
					});
				}
			},

			onDestroy: function () {
				clearTimeout(this.runTimer);
				this.destroyThrowable();
				elementorModules.frontend.handlers.Base.prototype.onDestroy.call(this);
			},

			destroyThrowable: function () {
				var state = this.throwable;

				if (!state) {
					return;
				}

				state.destroyed = true;
				state.timers.forEach(clearTimeout);
				clearTimeout(state.resizeTimer);

				if (state.visibilityObserver) {
					state.visibilityObserver.disconnect();
				}

				if (state.resizeObserver) {
					state.resizeObserver.disconnect();
				}

				if (state.scene) {
					state.scene.removeEventListener(
						"pointerdown",
						state.onPointerDown,
						true,
					);
					state.scene.removeEventListener("mousedown", state.onMouseDown, true);
					state.scene.removeEventListener("click", state.onClick, true);
					state.scene.removeEventListener("pointerup", state.onPointerUp, true);
					state.scene.removeEventListener(
						"pointercancel",
						state.onPointerCancel,
						true,
					);
					state.scene.style.pointerEvents = "";
				}

				if (state.mouse) {
					this.unbindThrowableMouse();
				}

				if (state.runner) {
					Matter.Runner.stop(state.runner);
					Matter.Events.off(state.runner);
				}

				if (state.mouseConstraint) {
					Matter.Events.off(state.mouseConstraint);
				}

				if (state.engine) {
					Matter.Engine.clear(state.engine);
				}

				this.throwable = null;
			},

			unbindThrowableMouse: function () {
				var state = this.throwable,
					scene = state.scene,
					mouse = state.mouse;

				scene.removeEventListener("mouseleave", mouse.mouseup);
				scene.removeEventListener("wheel", mouse.mousewheel);
				scene.removeEventListener("mousemove", mouse.mousemove);
				scene.removeEventListener("mousedown", mouse.mousedown);
				scene.removeEventListener("mouseup", mouse.mouseup);
				scene.removeEventListener("touchmove", mouse.mousemove);
				scene.removeEventListener("touchstart", mouse.mousedown);
				scene.removeEventListener("touchend", mouse.mouseup);
			},
		});

		elementorFrontend.elementsHandler.attachHandler(
			"premium-tcloud",
			PremiumTermsCloud,
		);
	});
})(jQuery);
