/**
 * LAS - Local Auto Save Plugin
 * localautosave/plugin.min.js
 *
 * Released under Creative Commons Attribution 3.0 Unported License
 *
 * License: http://creativecommons.org/licenses/by/3.0/
 * Plugin info: https://github.com/valtlfelipe/TinyMCE-LocalAutoSave
 * Author: Felipe Valtl de Mello
 *
 * Version: 0.2 released 23/09/2013
 */

tinymce.PluginManager.requireLangPack('localautosave');
tinymce.PluginManager.add("localautosave", function(editor, url) {

	/**
	 * ########################################
	 *     Plugin Variables
	 * ########################################
	 */
	var $form = $(editor.formElement);

	var $useLocalStorage = false;

	var $useSessionStorage = false;

	var $editorID = editor.id;

	var $busy = false;

	var $storage = localStorage;

	var cookieEncodeKey = {
		"%" : "%1",
		"&" : "%2",
		";" : "%3",
		"=" : "%4",
		"<" : "%5"
	};
	var cookieDecodeKey = {
		"%1" : "%",
		"%2" : "&",
		"%3" : ";",
		"%4" : "=",
		"%5" : "<"
	};
	var settings = {
		seconds : editor.getParam('las_seconds') || 5,
		keyName : editor.getParam('las_keyName') || 'LocalAutoSave',
		callback : editor.getParam('las_callback')
	};
	var cookieFilter = new RegExp("(?:^|;\\s*)" + settings.keyName + $editorID + "=([^;]*)(?:;|$)", "i");

	/**
	 * ########################################
	 *     Verify which save method
	 *     the browser supports
	 * ########################################
	 */
	try {
		$storage.setItem('LASTest', "OK");
		if ($storage.getItem('LASTest') === "OK") {
			$storage.removeItem('LASTest');
			$useLocalStorage = true;
		}
	} catch (error) {

		try {
			$storage = sessionStorage;
			$storage.setItem('LASTest', "OK");

			if ($storage.getItem('LASTest') === "OK") {
				$storage.removeItem('LASTest');
				$useSessionStorage = true;
			}
		} catch (error) {
			$storage = null;
		}
	}

	/**
	 * ########################################
	 *     Create Restore Button
	 * ########################################
	 */
	var button = editor.addButton("localautosave", {
		text : "",
		icon : 'restoredraft',
		tooltip : 'localautosave.restoreContent',
		onclick : function() {
			restore();
		}
	});

	/**
	 * ########################################
	 *     Encodes special characters to
	 *     save in browsers cookie
	 * ########################################
	 */
	function encodeCookie(str) {
		return str.replace(/[\x00-\x1f]+|&nbsp;|&#160;/gi, " ").replace(/(.)\1{5,}|[%&;=<]/g, function(c) {
			if (c.length > 1) {
				return ("%0" + c.charAt(0) + c.length.toString() + "%");
			}
			return cookieEncodeKey[c];
		});
	}

	/**
	 * ########################################
	 *     Decode special characters from
	 *     browsers cookie to display in editor
	 * ########################################
	 */
	function decodeCookie(str) {
		return str.replace(/%[1-5]|%0(.)(\d+)%/g, function(c, m, d) {
			var a, i, l;

			if (c.length == 2) {
				return cookieDecodeKey[c];
			}

			for ( a = [], i = 0, l = parseInt(d); i < l; i++) {
				a.push(m);
			}

			return a.join("");
		});
	}

	/**
	 * ########################################
	 *      Encodes special characters to
	 *     save in browsers Storage
	 * ########################################
	 */
	function encodeStorage(str) {
		return str.replace(/,/g, "&#44;");
	}

	/**
	 * ########################################
	 *     Decode special characters from
	 *     browsers storage to display in editor
	 * ########################################
	 */
	function decodeStorage(str) {
		return str.replace(/&#44;/g, ",");
	}

	/**
	 * ########################################
	 *     Save content action
	 * ########################################
	 */
	var save = function() {
		if ($busy === false && editor.isDirty()) {
			content = editor.getContent();
			is = editor.editorManager.is;
			var saved = false;
			if (is(content, "string") && (content.length > 0)) {
				now = new Date();
				exp = new Date(now.getTime() + (20 * 60 * 1000));
				try {
					if ($storage) {
						$storage.setItem(settings.keyName + $editorID, exp.toString() + "," + encodeStorage(content));
					} else {
						a = settings.keyName + $editorID + "=";
						b = "; expires=" + exp.toUTCString();
						document.cookie = a + encodeCookie(content).slice(0, 4096 - a.length - b.length) + b;
					}
					saved = true;
				} catch (error) {
					console.log(error);
				}

				if (saved === true) {
					obj = new Object();
					obj.content = content;
					obj.time = now.getTime();
					if (settings.callback) {
						settings.callback.call(obj);
					}
					var btn = getButtonByName('localautosave');
					$(btn).find('i').replaceWith('<i class="mce-ico mce-i-none" style="background: url(\'' + url + '/img/progress.gif\') no-repeat;"></i>');
					var t = setTimeout(function() {
						$(btn).find('i').replaceWith('<i class="mce-ico mce-i-restoredraft"></i>');
					}, 2000);
				}
			}
		}
	};
	/**
	 * ########################################
	 *    Set save interval
	 * ########################################
	 */
	var interval = setInterval(save, settings.seconds * 1000);

	/**
	 * ########################################
	 *     Restore content action
	 * ########################################
	 */
	function restore() {
		var content = null, is = editor.editorManager.is;
		$busy = true;
		try {
			if ($storage) {
				content = ($storage.getItem(settings.keyName + $editorID) || "").toString();
				i = content.indexOf(",");

				if (i == -1) {
					content = null;
				} else {
					content = decodeStorage(content.slice(i + 1, content.length));
				}
			} else {
				m = cookieFilter.exec(document.cookie);

				if (m) {
					content = decodeCookie(m[1]);
				}
			}
			if (!is(content, "string")) {
				editor.windowManager.alert('localautosave.noContent');
			} else {
				if (editor.getContent().replace(/\s|&nbsp;|<\/?p[^>]*>|<br[^>]*>/gi, "").length === 0) {
					editor.setContent(content);
					$busy = false;
				} else {
					editor.windowManager.confirm('localautosave.ifRestore', function(ok) {
						if (ok) {
							editor.setContent(content);
						}
						$busy = false;
					}, this);
				}
			}
		} catch (error) {
			console.log(error);
			$busy = false;
		}
	}

	/**
	 * ########################################
	 *     Get DOM for an toolbar button
	 * ########################################
	 */
	function getButtonByName(name, getEl) {
		var ed = editor, buttons = ed.buttons, toolbarObj = ed.theme.panel.find('toolbar *'), un = 'undefined';

		if ( typeof buttons[name] === un)
			return false;

		var settings = buttons[name], result = false, length = 0;

		tinymce.each(settings, function(v, k) {
			length++;
		});

		tinymce.each(toolbarObj, function(v, k) {
			if (v.type != 'button' || typeof v.settings === un)
				return;

			var i = 0;

			tinymce.each(v.settings, function(v, k) {
				if (settings[k] == v)
					i++;
			});

			if (i != length)
				return;

			result = v;

			if (getEl != false)
				result = v.getEl();

			return false;
		});

		return result;
	}

});
