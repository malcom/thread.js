/*
 * thread.js - simple emulation of multi-threading in JS
 * http://projects.malcom.pl/libs/thread-js.xhtml
 *
 * Copyright (C) 2011-2013 Marcin 'Malcom' Malich <me@malcom.pl>
 *
 * Released under the MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

/*
 * Changelog:
 *
 * 1.0 - 2011-08-07
 *  - first version
 *
 * 1.1 - 2011-12-01
 *  - fixed calling finish callback
 *  - fixed removing terminated thread from the queue
 *  - added simple protection against operations on (non)existing thread data in manager's interface
 *  - added time of thread execution
 *
 * 1.2 - 2013-01-05
 *  - added thread status
 *  - added implementation of pause/resume function
 *  - added namespace
 *
 */


const Thread = function() {

	const States = {
		New:		0,	// The thread has been created (but not started).
		Running:	1,	// The thread has been started (is running).
		Terminated:	2,	// The thread has been terminated.
		Paused:		3,	// The thread has been paused.
		Killed:		4,	// The thread has been killed.

		toString: function(state) {
			for (var x in this) {
				if (x == 'toString') continue;
				if (this[x] === state) return x;
			}
		}
	};


	var Create = function(func, finish) {

		var finishCallback = function() {
			if (finish)
				setTimeout(function() { finish(obj); } , 0);
		};

		var mData = {
			func: func,
			finish: finishCallback,
			priority: 0,
			state: 0,
			time: 0,
		};

		// public thread interface/object
		var obj = {

			// thread state
			state: function() {
				return mData.state;
			},

			// thread time excution
			time: function() {
				return mData.time;
			},


			// get/set the priority of the thread, between zero and 100
			getPriority: function() {
				return mData.priority;
			},

			setPriority: function(priority) {
				return mData.priority = priority;
			},


			// starts the thread execution
			run: function() {
				mData.time = 0;
				Manager.insert(mData);
			},

			// suspends the thread
			pause: function() {
				if (mData.state == States.Running) {
					Manager.remove(mData);
					mData.state = States.Paused;
				}
			},

			// resumes a thread suspended by the call to pause()
			resume: function() {
				if (mData.state == States.Paused)
					Manager.insert(mData);
			},

			// immediately terminates the thread
			kill: function() {
				Manager.remove(mData);
			},

		}

		return obj;
	};


	var Manager = function() {

		var mThreads = [];
		var mProcessing = false;
		var mProcess;
		var mScheduler;


		var process = function() {

			while (true) {
				yield;

				if (mProcessing)
					continue;

				mScheduler = scheduler();
				wakeUpScheduler();
			}

		};

		var wakeUpScheduler = function() {
			if (mScheduler.next())
				setTimeout(arguments.callee, 30);
			else
				mScheduler.close()
		};

		var scheduler = function() {

			mProcessing = true;
			var t = +new Date();

			while (mThreads.length) {
				for (var i = 0; i < mThreads.length; i++) {
					var thread = mThreads[i];
					try {
						thread.func.next();
						var dt = (+new Date()) - t;
						thread.time += dt;
						if (dt > 70) {
							yield true;
							t = +new Date();
						}
					} catch (ex if ex instanceof StopIteration) {
						mThreads.splice(i, 1); i--;
						thread.state = States.Terminated;
						thread.finish();
					}
				}
			}

			mProcessing = false;
			yield false;
		};


		mProcess = process();
		mProcess.next();


		return {

			// insert thread data to thread queue
			insert: function(thread) {
				var i = mThreads.indexOf(thread);
				if (i == -1) {
					thread.state = States.Running;
					mThreads.push(thread);
					mProcess.next();
				}
			},

			// remove thread data from thread queue
			remove: function(thread) {
				var i = mThreads.indexOf(thread);
				if (i != -1) {
					thread.state = States.Killed;
					mThreads.splice(i, 1);
				}
			},

			// has thread exist in thread queue
			exist: function(thread) {
				return mThreads.indexOf(thread) != -1;
			},

			// count of thread in thread queue
			count: function() {
				return mThreads.length;
			}

		};

	}();


	return {

		State:   States,	// thread states
		New:     Create,	// thread creator
		Manager: Manager	// thread manager

	};

}();
