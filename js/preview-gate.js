/**
 * Password gate for sooimkang.com (production only; localhost is always open).
 * Visitors without access are sent to /password.html, which stores a pass on
 * this device after the right password is entered.
 *
 * To change the password: put the SHA-256 of the new password in PASS_HASH
 * here AND in password.html (everyone will be asked again).
 *   Terminal: printf 'newpassword' | shasum -a 256
 *
 * Note: this keeps casual visitors out; it is not real security. The site's
 * files are still public on GitHub.
 */
(function () {
	'use strict';

	var PASS_HASH = '8e52ad3ae476e1f94dc9774e79752857b5127e6417ce8cd911f99f5bab3a277e';
	var STORAGE_KEY = 'portfolio_pass';

	var path = location.pathname;
	if (/\/password(?:\.html)?\/?$/i.test(path)) return;

	var host = location.hostname;
	if (host !== 'sooimkang.com' && host !== 'www.sooimkang.com') return;

	try { if (localStorage.getItem(STORAGE_KEY) === PASS_HASH) return; } catch (e) {}
	try { if (sessionStorage.getItem(STORAGE_KEY) === PASS_HASH) return; } catch (e) {}

	var next = path + location.search + location.hash;
	location.replace('/password.html?next=' + encodeURIComponent(next));
})();
