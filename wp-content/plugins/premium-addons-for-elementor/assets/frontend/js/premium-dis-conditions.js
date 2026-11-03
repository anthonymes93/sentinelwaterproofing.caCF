(function ($) {
	$(window).on("elementor/frontend/init", function () {
		//Time range condition cookie.
		var timeZoneMatch = new Date().toString().match(/([A-Z]+[\+-][0-9]+.*)/);

		if (!timeZoneMatch) return;

		var localTimeZone = timeZoneMatch[1].split("(")[0],
			isSecured = document.location.protocol === "https:" ? "secure" : "";

		document.cookie =
			"localTimeZone=" + localTimeZone + ";path=/;SameSite=Strict;" + isSecured;
	});
})(jQuery);
