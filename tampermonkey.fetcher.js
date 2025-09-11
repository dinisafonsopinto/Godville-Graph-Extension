// ==UserScript==
// @name         Godville Graph Extension
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Adds a new graph with the gold saved each day
// @author       Denis O First
// @match        https://stats.godvillegame.com/*
// @icon         https://secure.gravatar.com/avatar/42271c5418d5d2853f5579b9f2d51fad?rating=PG&size=200
// @run-at       document-idle
// ==/UserScript==

(function () {
	'use strict';

	// Bypass CSP restrictions, introduced by the latest Chrome updates
	if (window.trustedTypes && window.trustedTypes.createPolicy && !window.trustedTypes.defaultPolicy) {
		window.trustedTypes.createPolicy('default', {
			createHTML: string => string,
			createScriptURL: string => string,
			createScript: string => string
		});
	}

	function load(loadAttempts, link) {
		if (loadAttempts === 0) {
			if (window.top === window.self) {
				console.log('Initiating...');
			}
		}

		if (loadAttempts >= 9) {
			if (window.top === window.self) {
				console.log('Could not load');
				alert('Could not load! Please refresh the page to try again.');
			}

			return;
		}

		loadAttempts++;

		fetch(link)
			.then(response => response.text())
			.then(data => {
				let element = document.createElement('script');
				element.innerHTML = data;
				document.head.appendChild(element);
			})
			.catch((error) => {
				setTimeout(function () {
					load(loadAttempts, link);
				}, 500);
			});
	}

	load(0, 'https://raw.githubusercontent.com/dinisafonsopinto/Godville-Graph-Extension/refs/heads/main/content.js');
})();
