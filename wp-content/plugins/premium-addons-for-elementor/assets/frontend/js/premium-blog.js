(function ($) {
	$(window).on("elementor/frontend/init", function () {
		if (
			"undefined" !== typeof paElementsHandler &&
			paElementsHandler.isElementAlreadyExists("paBlog")
		) {
			return false;
		}

		var PremiumBlogHandler = elementorModules.frontend.handlers.Base.extend({
			settings: {},

			getDefaultSettings: function () {
				return {
					selectors: {
						user: ".fa-user",
						activeCat: ".category.active",
						loading: ".premium-loading-feed",
						blogElement: ".premium-blog-wrap",
						blogFilterTabs: ".premium-blog-filter",
						marqueeWrapper: ".premium-marquee-wrapper",
						contentWrapper: ".premium-blog-content-wrapper",
						blogPost: ".premium-blog-post-outer-container",
						metaSeparators: ".premium-blog-meta-separator",
						filterLinks: ".premium-blog-filters-container li a",
						currentPage:
							".premium-blog-pagination-container .page-numbers.current",
						activeElememnt: ".premium-blog-filters-container li .active",
					},
				};
			},

			getDefaultElements: function () {
				var selectors = this.getSettings("selectors"),
					elements = {
						$blogElement: this.$element.find(selectors.blogElement),
						$blogFilterTabs: this.$element.find(selectors.blogFilterTabs),
						$activeCat: this.$element.find(selectors.activeCat),
						$filterLinks: this.$element.find(selectors.filterLinks),
						$blogPost: this.$element.find(selectors.blogPost),
						$contentWrapper: this.$element.find(selectors.contentWrapper),
						$marqueeWrapper: this.$element.find(selectors.marqueeWrapper),
					};

				return elements;
			},

			bindEvents: function () {
				this.setLayoutSettings();
				this.removeMetaSeparators();
				this.run();
			},

			setLayoutSettings: function () {
				var settings = this.getElementSettings(),
					$blogPost = this.elements.$blogPost;

				var layoutSettings = {
					pageNumber: 1,
					isLoaded: true,
					count: 2,
					equalHeight: settings.force_height,
					layout: settings.premium_blog_layout,
					carousel: "yes" === settings.premium_blog_carousel ? true : false,
					infinite:
						"yes" === settings.premium_blog_infinite_scroll ? true : false,
					scrollAfter: "yes" === settings.scroll_to_offset ? true : false,
					grid: "yes" === settings.premium_blog_grid ? true : false,
					total: $blogPost.data("total"),
					flag: settings.filter_flag,
				};

				if (layoutSettings.carousel) {
					layoutSettings.slidesToScroll = settings.slides_to_scroll;
					layoutSettings.spacing = parseInt(
						settings.premium_blog_carousel_spacing,
					);
					layoutSettings.autoPlay =
						"yes" === settings.premium_blog_carousel_play;
					layoutSettings.arrows =
						"yes" === settings.premium_blog_carousel_arrows;
					layoutSettings.fade = "yes" === settings.premium_blog_carousel_fade;
					layoutSettings.center =
						"yes" === settings.premium_blog_carousel_center;
					layoutSettings.dots = "yes" === settings.premium_blog_carousel_dots;
					layoutSettings.overflowSlides = "yes" === settings.overflow_slides;
					layoutSettings.speed =
						"" !== settings.carousel_speed
							? parseInt(settings.carousel_speed)
							: 300;
					layoutSettings.autoplaySpeed =
						"" !== settings.premium_blog_carousel_autoplay_speed
							? parseInt(settings.premium_blog_carousel_autoplay_speed)
							: 5000;
					layoutSettings.arrows_position = settings.arrows_position;
				}

				this.settings = layoutSettings;
			},

			removeMetaSeparators: function () {
				var selectors = this.getSettings("selectors"),
					$blogPost = this.$element.find(selectors.blogPost);

				var $metaSeparators = $blogPost.first().find(selectors.metaSeparators),
					$user = $blogPost.find(selectors.user);

				if (1 === $metaSeparators.length) {
					//If two meta only are enabled. One of them is author meta.
					if (!$user.length) {
						$blogPost.find(selectors.metaSeparators).remove();
					}
				} else {
					if (!$user.length) {
						$blogPost.each(function (index, post) {
							$(post).find(selectors.metaSeparators).first().remove();
						});
					}
				}
			},
			run: function () {
				var _this = this,
					$blogElement = this.elements.$blogElement,
					$activeCategory = this.elements.$activeCat.data("filter"),
					$filterTabs = this.elements.$blogFilterTabs.length,
					pagination = $blogElement.data("pagination"),
					layout = this.settings.layout;

				this.settings.activeCategory = $activeCategory;
				this.settings.filterTabs = $filterTabs;

				// Handle categories/tags filter tabs.
				if (this.settings.filterTabs) {
					this.filterTabs();

					var url = new URL(window.location.href),
						filterIndex = url.searchParams.get(this.settings.flag);

					if (filterIndex) {
						this.triggerFilterTabs(filterIndex);
					}
				}

				if ("masonry" !== layout && this.settings.equalHeight)
					$blogElement.imagesLoaded(function () {
						_this.forceEqualHeight();
					});

				// Run masony layout.
				if ("masonry" === layout && !this.settings.carousel) {
					$blogElement.imagesLoaded(function () {
						if ("*" === _this.settings.activeCategory) {
							$blogElement.isotope(_this.getIsoTopeSettings());
						} else {
							$blogElement.isotope({
								itemSelector: ".premium-blog-post-outer-container",
								animate: false,
							});
						}
					});
				} else if (this.settings.carousel) {
					$blogElement.slick(this.getSlickSettings());

					// Show the carousel after initializing slick to avoid unstyled content flash.
					$blogElement.removeClass("premium-carousel-hidden");
				} else if ("marquee" === layout) {
					this.buildMarqueeLayout();
				}

				//Handle pagination click events.
				if (pagination) {
					this.paginate();
				}

				if (this.settings.infinite && $blogElement.is(":visible")) {
					this.getInfiniteScrollPosts();
				}
			},

			buildMarqueeLayout: function () {
				var settings = this.getElementSettings(),
					$blogElement = this.elements.$blogElement,
					$marqueeWrapper = this.elements.$marqueeWrapper,
					scrollDir = settings.marquee_direction;

				$blogElement.css({
					overflow: "hidden",
				});

				this.cloneItems();
				var horAlignWidth = this.setHorizontalWidth();

				var fullWidth = horAlignWidth;
				if ("normal" === scrollDir) {
					var animation = gsap.to($marqueeWrapper, {
						x: -fullWidth,
						duration: settings.marquee_speed,
						ease: "none",
						repeat: -1,
						modifiers: {
							x: gsap.utils.unitize((x) => parseFloat(x) % fullWidth),
						},
					});
				} else {
					gsap.set($marqueeWrapper[0], { x: -fullWidth });

					var animation = gsap.to($marqueeWrapper, {
						x: 0,
						duration: settings.marquee_speed,
						ease: "none",
						repeat: -1,
						modifiers: {
							x: gsap.utils.unitize((x) => {
								var value = parseFloat(x);
								return value > 0 ? value - fullWidth : value;
							}),
						},
					});
				}

				// Show the marquee after initializing GSAP to avoid unstyled content flash.
				$blogElement.removeClass("premium-carousel-hidden");

				// Make it draggable.
				var isDraggable =
					"yes" === this.getElementSettings("marquee_draggable") &&
					!elementorFrontend.isEditMode();
				if (isDraggable) {
					Draggable.create($marqueeWrapper, {
						type: "x",
						inertia: false,
						onPress: function () {
							animation.pause();
						},
						onDragEnd: function () {
							animation.invalidate().restart();
						},
						onDrag: function () {
							// Wrap position for seamless loop
							const currentX = gsap.getProperty($marqueeWrapper[0], "x");
							if (currentX > 0) {
								gsap.set($marqueeWrapper[0], { x: currentX - fullWidth });
							} else if (currentX < -fullWidth) {
								gsap.set($marqueeWrapper[0], { x: currentX + fullWidth });
							}
						},
					});
				}

				// Pause animation on hover.
				this.$element.hover(
					function () {
						animation.pause();
					},
					function () {
						animation.play();
					},
				);
			},

			cloneItems: function () {
				var $marqueeWrapper = this.elements.$marqueeWrapper,
					$items = $marqueeWrapper.find(".premium-blog-post-outer-container"),
					docFragment = new DocumentFragment();

				$items.each(function () {
					var clone = $(this).clone(true, true)[0];
					docFragment.appendChild(clone);
				});

				$marqueeWrapper.append(docFragment);
			},

			setHorizontalWidth: function () {
				var slidesSpacing =
						parseFloat(
							getComputedStyle(
								this.elements.$marqueeWrapper[0],
							).getPropertyValue("--pa-marquee-spacing"),
						) || 0,
					fullWidth = 0,
					$posts = this.$element.find(".premium-blog-post-outer-container"),
					slideWidth = $posts[0].offsetWidth;

				fullWidth = (slideWidth + slidesSpacing) * ($posts.length / 2);

				return fullWidth;
			},

			paginate: function () {
				var _this = this,
					$scope = this.$element,
					selectors = this.getSettings("selectors");

				$scope.on(
					"click",
					".premium-blog-pagination-container .page-numbers",
					function (e) {
						e.preventDefault();

						if ($(this).hasClass("current")) return;

						// The 'Main Query' source has no query context to inherit inside an
						// admin-ajax.php request, so instead of asking the AJAX handler to
						// rebuild it, fetch the real (already correctly-scoped) archive page
						// that paginate_links() linked to, and lift this widget's markup out of it.
						if (_this.isMainQuery()) {
							var href = $(this).attr("href");

							if (href) {
								_this.fetchMainQueryPage(href, _this.settings.scrollAfter);
							}

							return;
						}

						var currentPage = parseInt(
							$scope.find(selectors.currentPage).html(),
						);

						if ($(this).hasClass("next")) {
							_this.settings.pageNumber = currentPage + 1;
						} else if ($(this).hasClass("prev")) {
							_this.settings.pageNumber = currentPage - 1;
						} else {
							_this.settings.pageNumber = $(this).html();
						}

						_this.getPostsByAjax(_this.settings.scrollAfter);
					},
				);
			},

			isMainQuery: function () {
				return undefined !== this.elements.$blogElement.attr("data-next-page");
			},

			forceEqualHeight: function () {
				var heights = new Array(),
					contentWrapper = this.getSettings("selectors").contentWrapper,
					$blogWrapper = this.$element.find(contentWrapper);

				$blogWrapper.each(function (index, post) {
					var height = $(post).outerHeight();

					heights.push(height);
				});

				var maxHeight = Math.max.apply(null, heights);

				$blogWrapper.css("height", maxHeight + "px");
			},

			getSlickSettings: function () {
				var settings = this.settings,
					slickCols = settings.grid ? this.getSlickCols() : null,
					cols = settings.grid ? slickCols.cols : 1,
					colsTablet = settings.grid ? slickCols.colsTablet : 1,
					colsMobile = settings.grid ? slickCols.colsMobile : 1,
					prevArrow = settings.arrows
						? '<a type="button" data-role="none" class="carousel-arrow carousel-prev" aria-label="Previous" role="button" style=""><i class="fas fa-angle-left" aria-hidden="true"></i></a>'
						: "",
					nextArrow = settings.arrows
						? '<a type="button" data-role="none" class="carousel-arrow carousel-next" aria-label="Next" role="button" style=""><i class="fas fa-angle-right" aria-hidden="true"></i></a>'
						: "";

				var carouselOptions = {
					infinite: !settings.overflowSlides,
					slidesToShow: cols,
					slidesToScroll: settings.slidesToScroll || cols,
					responsive: [
						{
							breakpoint: 1025,
							settings: {
								slidesToShow: colsTablet,
								slidesToScroll: 1,
							},
						},
						{
							breakpoint: 768,
							settings: {
								slidesToShow: colsMobile,
								slidesToScroll: 1,
							},
						},
					],
					autoplay: settings.autoPlay,
					rows: 0,
					speed: settings.speed,
					autoplaySpeed: settings.autoplaySpeed,
					arrows: settings.arrows,
					nextArrow: nextArrow,
					prevArrow: prevArrow,
					fade: settings.fade && !settings.overflowSlides,
					centerMode: settings.center && !settings.overflowSlides,
					centerPadding: settings.spacing + "px",
					draggable: true,
					dots: settings.dots,
					customPaging: function () {
						return '<i class="fas fa-circle"></i>';
					},
				};

				if ("default" !== settings.arrows_position) {
					carouselOptions.appendArrows = this.$element.find(
						".premium-carousel-arrows-wrapper",
					);
				}

				return carouselOptions;
			},

			getSlickCols: function () {
				var slickCols = this.getElementSettings(),
					cols = slickCols.premium_blog_columns_number,
					colsTablet = slickCols.premium_blog_columns_number_tablet,
					colsMobile = slickCols.premium_blog_columns_number_mobile;

				return {
					cols: parseInt(100 / cols.substr(0, cols.indexOf("%"))),
					colsTablet: parseInt(
						100 / colsTablet.substr(0, colsTablet.indexOf("%")),
					),
					colsMobile: parseInt(
						100 / colsMobile.substr(0, colsMobile.indexOf("%")),
					),
				};
			},

			getIsoTopeSettings: function () {
				return {
					itemSelector: ".premium-blog-post-outer-container",
					percentPosition: true,
					filter: this.settings.activeCategory,
					animationOptions: {
						duration: 750,
						easing: "linear",
						queue: false,
					},
				};
			},

			filterTabs: function () {
				var _this = this,
					selectors = this.getSettings("selectors"),
					$filterLinks = this.elements.$filterLinks;

				$filterLinks.click(function (e) {
					e.preventDefault();

					_this.$element.find(selectors.activeElememnt).removeClass("active");

					$(this).addClass("active");

					//Get clicked tab slug
					_this.settings.activeCategory = $(this).attr("data-filter");

					_this.settings.pageNumber = 1;

					if (_this.settings.infinite) {
						_this.getPostsByAjax(false);
						_this.settings.count = 2;
						_this.getInfiniteScrollPosts();
					} else {
						//Make sure to reset pagination before sending our AJAX request
						_this.getPostsByAjax(_this.settings.scrollAfter);
					}
				});
			},

			triggerFilterTabs: function (filterIndex) {
				var $targetFilter = this.elements.$filterLinks.eq(filterIndex);

				$targetFilter.trigger("click");
			},

			getPostsByAjax: function (shouldScroll) {
				//If filter tabs is not enabled, then always set category to all.
				if ("undefined" === typeof this.settings.activeCategory) {
					this.settings.activeCategory = "*";
				}

				var _this = this,
					$blogElement = this.elements.$blogElement,
					selectors = this.getSettings("selectors");

				$.ajax({
					url: PremiumSettings.ajaxurl,
					dataType: "json",
					type: "POST",
					data: {
						action: "pa_get_posts",
						page_id: $blogElement.data("page"),
						widget_id: _this.$element.data("id"),
						page_number: _this.settings.pageNumber,
						category: _this.settings.activeCategory,
						nonce: PremiumSettings.nonce,
					},
					beforeSend: function () {
						$blogElement.append(
							'<div class="premium-loading-feed"><div class="premium-loader"></div></div>',
						);

						var stickyOffset = 0;
						if ($(".elementor-sticky").length > 0) stickyOffset = 100;

						if (shouldScroll) {
							$("html, body").animate(
								{
									scrollTop: $blogElement.offset().top - 50 - stickyOffset,
								},
								"slow",
							);
						}
					},
					success: function (res) {
						if (!res.data) return;

						$blogElement.find(selectors.loading).remove();

						_this.applyPostsResult(res.data.posts, res.data.paging);
					},
					error: function (err) {
						console.log(err);
					},
				});
			},

			//reinitialize newly loaded posts identically.
			applyPostsResult: function (posts, paging) {
				var $blogElement = this.elements.$blogElement;

				if (this.settings.infinite) {
					this.settings.isLoaded = true;
					if (this.settings.filterTabs && this.settings.pageNumber === 1) {
						$blogElement.html(posts);
					} else {
						$blogElement.append(posts);
					}
				} else {
					//Render the new markup into the widget
					$blogElement.html(posts);

					this.$element.find(".premium-blog-footer").html(paging);
				}

				this.removeMetaSeparators();

				//Make sure grid option is enabled.
				if (this.settings.layout) {
					if ("even" === this.settings.layout) {
						if (this.settings.equalHeight) this.forceEqualHeight();
					} else {
						$blogElement.imagesLoaded(function () {
							$blogElement.isotope("reloadItems");
							$blogElement.isotope({
								itemSelector: ".premium-blog-post-outer-container",
								animate: false,
							});
						});
					}
				}
			},

			// Fetch this widget's own markup out of the returned page.
			fetchMainQueryPage: function (url, shouldScroll) {
				var _this = this,
					$blogElement = this.elements.$blogElement,
					selectors = this.getSettings("selectors"),
					elementId = this.$element.data("id");

				$blogElement.append(
					'<div class="premium-loading-feed"><div class="premium-loader"></div></div>',
				);

				var stickyOffset = 0;
				if ($(".elementor-sticky").length > 0) stickyOffset = 100;

				if (shouldScroll) {
					$("html, body").animate(
						{
							scrollTop: $blogElement.offset().top - 50 - stickyOffset,
						},
						"slow",
					);
				}

				fetch(url)
					.then(function (response) {
						return response.text();
					})
					.then(function (html) {
						var $remote = $(new DOMParser().parseFromString(html, "text/html")),
							$remoteWidget = $remote.find('[data-id="' + elementId + '"]'),
							$remoteBlogElement = $remoteWidget.find(selectors.blogElement),
							posts = $remoteBlogElement.html(),
							paging = $remoteWidget.find(".premium-blog-footer").html() || "";

						// Sync pagination attributes.
						$blogElement.attr(
							"data-next-page",
							$remoteBlogElement.attr("data-next-page"),
						);
						$blogElement.attr(
							"data-current-page",
							$remoteBlogElement.attr("data-current-page"),
						);

						$blogElement.find(selectors.loading).remove();

						_this.applyPostsResult(posts, paging);
					})
					.catch(function (err) {
						$blogElement.find(selectors.loading).remove();
						console.log(err);
					});
			},

			getInfiniteScrollPosts: function () {
				var windowHeight = jQuery(window).outerHeight() / 1.25,
					_this = this,
					ticking = false;

				$(window).on("scroll", function () {
					if (ticking) {
						return;
					}

					ticking = true;
					requestAnimationFrame(function () {
						ticking = false;

						if (_this.isMainQuery()) {
							var $blogElement = _this.elements.$blogElement,
								currentPage =
									parseInt($blogElement.attr("data-current-page"), 10) || 1,
								maxPage = parseInt($blogElement.attr("data-max-page"), 10) || 1,
								nextPageUrl = $blogElement.attr("data-next-page");

							if (currentPage >= maxPage || !nextPageUrl) {
								return;
							}

							var mainScrollTop = $(window).scrollTop(),
								mainLastPost = _this.$element.find(
									".premium-blog-post-outer-container:last",
								),
								mainLastPostTop = mainLastPost.length
									? mainLastPost.offset().top
									: 0;

							if (
								mainScrollTop + windowHeight >= mainLastPostTop &&
								true == _this.settings.isLoaded
							) {
								_this.settings.isLoaded = false;
								_this.fetchMainQueryPage(nextPageUrl, false);
							}

							return;
						}

						if (_this.settings.filterTabs) {
							$blogPost = _this.elements.$blogElement.find(
								".premium-blog-post-outer-container",
							);
							_this.settings.total = $blogPost.data("total");
						}

						if (_this.settings.count <= _this.settings.total) {
							var scrollTop = $(window).scrollTop(),
								lastPost = _this.$element.find(
									".premium-blog-post-outer-container:last",
								),
								lastPostTop = lastPost.length ? lastPost.offset().top : 0;

							if (scrollTop + windowHeight >= lastPostTop) {
								if (true == _this.settings.isLoaded) {
									_this.settings.pageNumber = _this.settings.count;
									_this.getPostsByAjax(false);
									_this.settings.count++;
									_this.settings.isLoaded = false;
								}
							}
						}
					});
				});
			},
		});

		elementorFrontend.elementsHandler.attachHandler(
			"premium-addon-blog",
			PremiumBlogHandler,
		);
	});
})(jQuery);
