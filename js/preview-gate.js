/**
 * Production “coming soon” gate for sooimkang.com only.
 * Local dev (localhost) is always allowed.
 * On production, visit once: /?preview=kang-studio-preview
 * (change PREVIEW_SECRET below). Access is remembered in localStorage.
 */
(function () {
	'use strict';

	var path = location.pathname;
	if (/coming-soon(?:\.html)?\/?$/i.test(path)) return;

	var host = location.hostname;
	var isProduction =
		host === 'sooimkang.com' || host === 'www.sooimkang.com';

	if (!isProduction) return;

	var PREVIEW_STORAGE_KEY = 'portfolio_preview_unlocked';
	var PREVIEW_SECRET = 'kang-studio-preview';

	var params = new URLSearchParams(location.search);
	if (params.get('preview') === PREVIEW_SECRET) {
		try {
			localStorage.setItem(PREVIEW_STORAGE_KEY, '1');
		} catch (e) {}
		params.delete('preview');
		var rest = params.toString();
		var nextUrl = location.pathname + (rest ? '?' + rest : '') + location.hash;
		history.replaceState(null, '', nextUrl);
		return;
	}

	try {
		if (localStorage.getItem(PREVIEW_STORAGE_KEY) === '1') return;
	} catch (e) {}

	location.replace('/coming-soon.html');
})();
