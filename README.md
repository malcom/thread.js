Thread.js
=========

Simple emulation of multi-threading in JS based on [generators](http://wiki.ecmascript.org/doku.php?id=harmony:generators).

# Example #
Simple example of usage.

```javascript
function count(name, n, k) {
	for (var i=0; i<n; i++) {
		console.log(name + ': ' + i);

		// sleeep
		for (var j=0; j<1000000; j++) {}

		if (!(i%k)) yield;
	}
}

Thread.New(
	count('foo', 100, 2),
	function(thread) { console.log('foo complete: ' + thread.time() + 'ms'); }
).run();

Thread.New(
	count('bar', 100, 2),
	function(thread) { console.log('bar complete: ' + thread.time() + 'ms'); }
).run();
```

More [examples](http://github.com/malcom/thread.js/blob/master/example.html).

# Links #
* [Thread.js at projects.malcom.pl](http://projects.malcom.pl/libs/thread-js.xhtml)
