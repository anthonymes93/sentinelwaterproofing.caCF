(function ($) {
	var PremiumSearchHandler = function ($scope, $) {
		var widgetID = $scope.data("id");

		$scope = $(".elementor-element-" + widgetID);

		var $container = $scope.find(".premium-search__container"),
			settings = $container.data("settings"),
			$search = $scope.find(".premium-search__input"),
			$spinnerWrap = $scope.find(".premium-search__spinner"),
			queryType = settings.query,
			buttonAction = settings.buttonAction || "onpage",
			lastSearchQuery = null,
			highlightColor = getComputedStyle($scope[0]).getPropertyValue(
				"--pa-search-hightlight",
			);

		if ("post" === queryType) {
			var $resultsContainer = $scope.find(".premium-search__query-wrap"),
				pageNumber = 1;

			if (settings.hideOnClick) {
				$("body").on("click", function (event) {
					var widgetContent =
						".premium-search__container, .premium-search__container *, .premium-search__query-wrap, .premium-search__query-wrap *";

					if (!$(event.target).is($scope.find(widgetContent))) {
						$resultsContainer.html("").addClass("query-hidden");
					}
				});
			}
		} else {
			var searchTarget = settings.target || ".e-con";
		}

		if ("onpage" === buttonAction) {
			$container.on("click", ".premium-search__btn", handleSearch);

			$search.on("keyup", function () {
				var searchQuery = $search.val();

				//Hide the current query every time a keyboard is clicked. But only if query string is changed.
				if (searchQuery !== lastSearchQuery && "post" === queryType)
					$resultsContainer.html("").addClass("query-hidden");

				if ("" === searchQuery) {
					var $textElems = $(searchTarget)
						.find("li,h1,h2,h3,h4,h5,h6,p,span,i,svg")
						.not(".elementor-element-overlay *");
					$textElems.css("filter", "blur(0px)");

					var $fadeElems = $(settings.fadeout_target).find(
						"li,h1,h2,h3,h4,h5,h6,p,span,i,svg",
					);
					$fadeElems.css("opacity", "1");
				}
			});
		} else {
			$container.on("click", ".premium-search__btn", function () {
				var searchQuery = $search.val(),
					postType =
						$container.find(".premium-search__type-select").val() || [];

				window.location.href =
					settings.search_link + "?s=" + searchQuery + "&post_type=" + postType;
			});
		}

		//On click remove button.
		$container.on("click", ".premium-search__remove-wrap", function () {
			$search.val("");
			handleSearch("remove");
		});

		//On change post type select.
		$container.find(".premium-search__type-select").on("change", function () {
			lastSearchQuery = "";
			handleSearch();
		});

		//We want the search to be triggered all time.
		$search.on("keyup", handleSearch);

		//For enter button.
		document.addEventListener("keydown", function (event) {
			if ($container.hasClass("is-focused")) {
				if (13 === event.keyCode) handleSearch();
			}
		});

		$search.on("focus blur", function (e) {
			$container.toggleClass("is-focused");

			if ("focus" === e.type) {
				lastSearchQuery = "";
				handleSearch();
			}
		});

		if ($scope.hasClass("premium-search-anim-label-letter")) {
			var $label = $container.find("label");

			$search.on("focus", function () {
				var letterSpacing = parseFloat(
					$label.css("letter-spacing").replace("px", ""),
				);

				$label.css("letter-spacing", letterSpacing + 3 + "px");
			});

			$search.on("blur", function () {
				var letterSpacing = parseFloat(
					$label.css("letter-spacing").replace("px", ""),
				);

				$label.css("letter-spacing", letterSpacing - 3 + "px");
			});
		}

		function handleSearch(trigger) {
			var timeToWait =
				"remove" === trigger ? 10 : "elements" === queryType ? 100 : 1000;

			setTimeout(function () {
				var searchQuery = $search.val();

				if (
					!$container.hasClass("fetching") &&
					searchQuery !== lastSearchQuery
				) {
					if ("post" === queryType)
						$resultsContainer.html("").addClass("query-hidden");

					if ("elements" !== queryType) {
						if ("" !== searchQuery) {
							$.ajax({
								url: PremiumSettings.ajaxurl,
								dataType: "json",
								type: "POST",
								data: {
									action: "premium_get_search_results",
									nonce: PremiumSettings.nonce,
									page_id: $container.data("page"),
									page_number: 1,
									widget_id: $scope.data("id"),
									query: searchQuery,
									post_type: $container
										.find(".premium-search__type-select")
										.val(),
									results_number: settings.results_number,
								},
								beforeSend: function () {
									$container
										.find(".premium-search__remove-wrap")
										.addClass("premium-addons__v-hidden");

									$spinnerWrap.append(
										'<div class="premium-loading-feed"><div class="premium-loader"></div></div>',
									);

									$container.addClass("fetching");
								},
								success: function (res) {
									if (!res.data) return;

									var posts = res.data.posts,
										pagination = res.data.pagination;

									$spinnerWrap.find(".premium-loading-feed").remove();

									$container
										.find(".premium-search__remove-wrap")
										.removeClass("premium-addons__v-hidden");

									$resultsContainer.html(posts).removeClass("query-hidden");

									if (settings.carousel)
										$resultsContainer
											.find(".premium-search__posts-wrap")
											.slick(getSlickSettings());

									// if ($container.hasClass('premium-search__skin-banner'))
									forceEqualHeight();

									if ("" !== pagination) {
										$resultsContainer.append(
											"<div class='premium-search__footer'></div>",
										);
										$resultsContainer
											.find(".premium-search__footer")
											.html(pagination);
									}

									$container.removeClass("fetching");
								},
								error: function (err) {
									console.log(err);

									$spinnerWrap.find(".premium-loading-feed").remove();
									$container.removeClass("fetching");
								},
							});
						}
					} else {
						var effect = settings.effect || "blur_highlight";

						// Restore the previous query's highlights before re-scanning.
						clearHighlights();

						var $textElems = $(searchTarget)
								.find("li,h1,h2,h3,h4,h5,h6,p,span,i,svg")
								.not(".elementor-element-overlay *"),
							$fadeElems = $(settings.fadeout_target).find(
								"li,h1,h2,h3,h4,h5,h6,p,span,i,svg",
							);

						$textElems.css("transition", "filter 0.3s ease-in-out");
						$fadeElems.css("transition", "opacity 0.3s ease-in-out");

						$textElems.css("filter", "blur(0px)");
						$fadeElems.css("opacity", "1");

						if ("" !== searchQuery) {
							searchQuery = searchQuery.trim().toLowerCase();

							// Filter elements that don't contain the specified text (case-sensitive)
							var $queriedElems = $textElems.filter(function () {
								return $(this).text().toLowerCase().indexOf(searchQuery) == -1;
							});

							if ("blur" === effect || "blur_highlight" === effect) {
								$queriedElems.css("filter", "blur(3px)");
								$fadeElems.css("opacity", "0.4");
							}

							if (
								("highlight" === effect || "blur_highlight" === effect) &&
								highlightColor
							) {
								var $matchedElems = $textElems.filter(function () {
									return (
										$(this).text().toLowerCase().indexOf(searchQuery) !== -1
									);
								});

								$matchedElems.each(function () {
									if ($(this).is(":visible") && "LI" !== this.tagName) {
										highlightMatches(this, searchQuery);
									}
								});
							}
						}
					}

					lastSearchQuery = searchQuery;
				}
			}, timeToWait);
		}

		function forceEqualHeight() {
			var heights = new Array(),
				$contentWrapper = $container.find(".premium-search__post-content");

			$contentWrapper.each(function (index, post) {
				var height = $(post).outerHeight();

				heights.push(height);
			});

			var maxHeight = Math.max.apply(null, heights);

			$contentWrapper.css("height", maxHeight + "px");
		}

		function clearHighlights() {
			$(searchTarget)
				.find(".pa-highlighted-text-" + widgetID)
				.each(function () {
					var parent = this.parentNode;

					parent.replaceChild(document.createTextNode(this.textContent), this);
					parent.normalize();
				});
		}

		function highlightMatches(elem, query) {
			if ("" === query) {
				return;
			}

			var nodes = elem.childNodes;

			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];

				if (3 !== node.nodeType) {
					continue;
				}

				var text = node.nodeValue,
					lower = text.toLowerCase(),
					index = lower.indexOf(query);

				if (-1 === index) {
					continue;
				}

				var frag = document.createDocumentFragment(),
					cursor = 0;

				while (-1 !== index) {
					if (index > cursor) {
						frag.appendChild(
							document.createTextNode(text.slice(cursor, index)),
						);
					}

					var span = document.createElement("span");

					span.className =
						"pa-highlighted-text pa-highlighted-text-" + widgetID;
					span.textContent = text.slice(index, index + query.length);
					frag.appendChild(span);

					cursor = index + query.length;
					index = lower.indexOf(query, cursor);
				}

				if (cursor < text.length) {
					frag.appendChild(document.createTextNode(text.slice(cursor)));
				}

				var inserted = frag.childNodes.length;

				elem.replaceChild(frag, node);
				i += inserted - 1;
			}
		}

		function getSlickSettings() {
			var cols = getComputedStyle($scope[0]).getPropertyValue(
					"--pa-search-carousel-slides",
				),
				prevArrow = settings.arrows
					? '<a type="button" data-role="none" class="carousel-arrow carousel-prev" aria-label="Previous" role="button" style=""><i class="fas fa-angle-left" aria-hidden="true"></i></a>'
					: "",
				nextArrow = settings.arrows
					? '<a type="button" data-role="none" class="carousel-arrow carousel-next" aria-label="Next" role="button" style=""><i class="fas fa-angle-right" aria-hidden="true"></i></a>'
					: "";

			cols = parseInt(100 / cols.substr(0, cols.indexOf("%")));

			return {
				infinite: false,
				draggable: true,
				autoplay: false,
				slidesToShow: cols,
				slidesToScroll: settings.slidesToScroll || cols,

				rows: settings.rows,
				speed: settings.speed,
				nextArrow: nextArrow,
				prevArrow: prevArrow,
				fade: settings.fade,
				centerMode: settings.center,
				centerPadding: settings.spacing + "px",

				dots: settings.dots,
				customPaging: function () {
					return '<i class="fas fa-circle"></i>';
				},
			};
		}

		$scope.on(
			"click",
			".premium-search-form__pagination-container .page-numbers",
			function (e) {
				e.preventDefault();

				if ($(this).hasClass("current")) return;

				var currentPage = parseInt($scope.find(".page-numbers.current").html());

				if ($(this).hasClass("next")) {
					pageNumber = currentPage + 1;
				} else if ($(this).hasClass("prev")) {
					pageNumber = currentPage - 1;
				} else {
					pageNumber = $(this).html();
				}

				$.ajax({
					url: PremiumSettings.ajaxurl,
					dataType: "json",
					type: "POST",
					data: {
						action: "premium_get_search_results",
						nonce: PremiumSettings.nonce,
						page_id: $container.data("page"),
						page_number: pageNumber,
						widget_id: $scope.data("id"),
						query: lastSearchQuery,
						post_type: $container.find(".premium-search__type-select").val(),
						results_number: settings.results_number,
					},
					beforeSend: function () {
						$container
							.find(".premium-search__remove-wrap")
							.addClass("premium-addons__v-hidden");

						$resultsContainer.append(
							'<div class="premium-loading-feed"><div class="premium-loader"></div></div>',
						);

						$container.addClass("fetching");
					},
					success: function (res) {
						if (!res.data) return;

						var posts = res.data.posts,
							pagination = res.data.pagination;

						$resultsContainer.find(".premium-loading-feed").remove();

						$container
							.find(".premium-search__remove-wrap")
							.removeClass("premium-addons__v-hidden");

						$resultsContainer.html(posts).removeClass("query-hidden");

						forceEqualHeight();

						$resultsContainer.append(
							"<div class='premium-search__footer'></div>",
						);

						$resultsContainer.find(".premium-search__footer").html(pagination);

						$container.removeClass("fetching");
					},
					error: function (err) {
						console.log(err);

						$spinnerWrap.find(".premium-loading-feed").remove();

						$container.removeClass("fetching");
					},
				});
			},
		);
	};

	$(window).on("elementor/frontend/init", function () {
		if (
			"undefined" !== typeof paElementsHandler &&
			paElementsHandler.isElementAlreadyExists("paSearch")
		) {
			return false;
		}

		elementorFrontend.hooks.addAction(
			"frontend/element_ready/premium-search-form.default",
			PremiumSearchHandler,
		);
	});
})(jQuery);
