/**
 * Add a class to the AI Studio connector for CSS targeting.
 */
(function() {
	// Simple interval to find and mark the AI Studio connector
	let attempts = 0;
	const maxAttempts = 20;

	const interval = setInterval(function() {
		attempts++;

		// Find all h2 elements
		const headings = document.querySelectorAll('h2');
		for (let i = 0; i < headings.length; i++) {
			if (headings[i].textContent.includes('SiteGround AI')) {
				// Walk up to find the item container
				let container = headings[i];
				for (let j = 0; j < 10; j++) {
					container = container.parentElement;
					if (!container) break;

					// Found the item container
					if (container.classList.contains('components-item')) {
						container.classList.add('sg-ai-studio-connector');
						if( sg_ai_studio_connected.connected === '1') {
							container.classList.add('connected');
						}
						clearInterval(interval);
						bindAIStudioConnectorButton();
						return;
					}
				}
			}
		}

		if (attempts >= maxAttempts) {
			clearInterval(interval);
		}
	}, 300);


	function bindAIStudioConnectorButton() {
	const button = document.querySelector('.sg-ai-studio-connector:not(.connected) button');
	if (button) {
		button.addEventListener('click', function (e) {
			e.preventDefault();
			window.location.href = sg_ai_studio_connected.admin_url;
		});
	}
	}

})();
