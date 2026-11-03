// Shared by every element template, so the markup is defined once instead of being printed into each one.
window.paGTooltipsEditor = (function () {
	function getTextContent(view, settings) {
		var html =
			'<span class="premium-tootltip-text">' +
			elementor.helpers.sanitize(settings.premium_tooltip_text);

		if ("yes" === settings.premium_tooltip_icon_switcher) {
			var iconHTML = elementor.helpers.renderIcon(
				view,
				settings.premium_tooltip_icon,
				{ "aria-hidden": true },
				"i",
				"object",
			);

			view.addRenderAttribute("gTooltipsIconHolder", {
				class: "premium-tootltip-icon",
			});

			html +=
				"<span " +
				view.getRenderAttributeString("gTooltipsIconHolder") +
				" > " +
				iconHTML.value +
				"</span>";
		}

		return html + "</span>";
	}

	function getGalleryContent(view, gallery) {
		view.addRenderAttribute("gTooltipsGallery", {
			src: gallery[0].url,
		});

		return (
			'<span class="premium-tooltip-gallery"><img ' +
			view.getRenderAttributeString("gTooltipsGallery") +
			"></span>"
		);
	}

	function getLottieContent(view, settings) {
		view.addRenderAttribute("gTooltipsLottie", {
			class: "premium-lottie-animation premium-tooltip-lottie",
			"data-lottie-url": settings.premium_tooltip_lottie_url,
			"data-lottie-loop": settings.premium_tooltip_lottie_loop,
			"data-lottie-reverse": settings.premium_tooltip_lottie_reverse,
		});

		return (
			"<div " + view.getRenderAttributeString("gTooltipsLottie") + " ></div>"
		);
	}

	function getResponsiveSize(settings, control, fallback) {
		var size = {};

		["desktop", "mobile", "tablet"].forEach(function (device) {
			var value =
				settings["desktop" === device ? control : control + "_" + device].size;

			size[device] = "" !== value ? value : fallback;
		});

		return size;
	}

	function getTooltipSettings(settings, content) {
		var tooltipSettings = {
			type: settings.premium_tooltip_type,
			content: content,
			minWidth: getResponsiveSize(settings, "premium_tooltip_min_width", 0),
			maxWidth: getResponsiveSize(settings, "premium_tooltip_max_width", null),
			zindex: settings.pa_tooltip_zindex,
			target: settings.pa_tooltip_target,
			anime: settings.premium_tooltip_anime,
			trigger: settings.premium_tooltip_trigger,
			side: settings.premium_tooltip_position,
			arrow: "yes" === settings.premium_tooltip_arrow,
			distance:
				"" !== settings.premium_tooltip_distance_position
					? settings.premium_tooltip_distance_position
					: 6,
			duration:
				"" !== settings.premium_tooltip_anime_dur
					? settings.premium_tooltip_anime_dur
					: 350,
			delay:
				"" !== settings.premium_tooltip_anime_delay
					? settings.premium_tooltip_anime_delay
					: 10,
			hideOn: settings.hide_tooltip_on,
		};

		var followMouse = "yes" === settings.premium_tooltip_mouse_follow;

		if (undefined === settings.pa_tooltip_class) {
			tooltipSettings.follow_mouse = followMouse;

			return tooltipSettings;
		}

		tooltipSettings.uniqueClass = settings.pa_tooltip_class;
		tooltipSettings.follow_mouse = !settings.pa_tooltip_class && followMouse;

		if (settings.pa_tooltip_class) {
			tooltipSettings.isTourStarter = "yes" === settings.is_tour_starter;
		}

		return tooltipSettings;
	}

	function render(view, settings) {
		if ("yes" !== settings.premium_tooltip_switcher) {
			return "";
		}

		var id = view.getID(),
			type = settings.premium_tooltip_type,
			tooltipContent = {},
			innerHTML = "";

		view.addRenderAttribute("gTooltipshtml", {
			id: "tooltip_content-" + id,
			class:
				"premium-global-tooltip-content premium-tooltip-content-wrapper-" + id,
		});

		view.addRenderAttribute("gTooltipTemp", {
			class:
				"premium-gtooltips-temp premium-global-tooltips-wrapper-temp-" + id,
			style: "display: none",
		});

		switch (type) {
			case "template":
				view.addRenderAttribute("gTooltipshtml", {
					"data-template-id":
						"" === settings.premium_tooltip_template
							? settings.live_temp_content
							: settings.premium_tooltip_template,
				});
				break;

			case "text":
				innerHTML = getTextContent(view, settings);
				break;

			case "gallery":
				if (settings.premium_tooltip_gallery[0]) {
					tooltipContent = settings.premium_tooltip_gallery;
					innerHTML = getGalleryContent(view, tooltipContent);
				}
				break;

			case "lottie":
				innerHTML = getLottieContent(view, settings);
				break;
		}

		view.addRenderAttribute("gTooltips", {
			id: "premium-global-tooltips-" + id,
			class: "premium-global-tooltips-wrapper",
			"data-tooltip_settings": JSON.stringify(
				getTooltipSettings(settings, tooltipContent),
			),
		});

		return (
			"<div " +
			view.getRenderAttributeString("gTooltipTemp") +
			" >" +
			"<div " +
			view.getRenderAttributeString("gTooltipshtml") +
			">" +
			innerHTML +
			"</div>" +
			"</div>" +
			"<div " +
			view.getRenderAttributeString("gTooltips") +
			"></div>"
		);
	}

	return {
		render: render,
	};
})();
