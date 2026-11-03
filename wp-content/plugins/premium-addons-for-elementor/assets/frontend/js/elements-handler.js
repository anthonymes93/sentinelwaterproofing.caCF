window.paElementsHandler = {
	isElementAlreadyExists: function (name) {
		if (window.paElementList && name in window.paElementList) {
			return true;
		} else {
			window.paElementList = { ...window.paElementList, [name]: true }
		}
		return false;
	}
}
