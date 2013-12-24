Local AutoSave plugin for TinyMCE 4.x
=============

Save the TinyMCE (v4.x) content to LocalStorage*, SessionStorage* or Cookie in your Browser to avoid losing your content in an page refresh, etc.

*If your Browser supports. Cookie is the fallback.

Quick start
-----------

1. [Download a copy (.zip)](https://github.com/valtlfelipe/TinyMCE-LocalAutoSave/zipball/master).

2. Unzip the `localautosave` folder in your TinyMCE plugin folder `tinymce/plugins/`.

3. Initialize plugin and add it to the toolbar. Example:
```js
tinymce.init({
	plugins: "localautosave",
	toolbar1: "localautosave"
});
```

Documentation
-------

You can configure this plugin using the methods listed here (those configurations are optional):

1. `las_seconds` => set the period to save the content in seconds (s).

2. `las_keyName` => set the key name for the LocalStorage, SessionStorage or Cookie.

3. `las_callback` => fires an function with two variables in `this` object when content is saved successfully.

4. `las_nVersions` => number of versions of content you want to store (default 15, set 0 to disable) 

Example:
```js
tinymce.init({
	plugins: "localautosave",
	toolbar1: "localautosave",
	las_seconds: 15,
	las_keyName: "LocalAutoSave",
	las_callback: function() {
		var content = this.content; //content saved
		var time = this.time; //time on save action
	}
});
```

Thank you to [Valerio Gentile](https://github.com/valgen) for contributing.
