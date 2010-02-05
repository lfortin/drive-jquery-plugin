// Drive jQuery plugin v1.0.0
// http://github.com/lfortin/drive-jquery-plugin#readme

// Copyright (c) 2009-2010 Laurent Fortin
// 
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


(function($) {

	/**** main class for Drive jQuery plugin ****/

	$.extend({
		// main class
		DriveClass: function(cfg) {
			this.init(cfg);
		},

		// internal data
		_jquerydrive: {
			options: {
				selector: '',
				context: document,
				defaultTag: 'div',
				inputType: 'text',
				insertMethod: 'append',
				attr: {},
				css: {},
				success: function(){},
				failure: function(){},
				except: function(){}
			}
		},

		// setter / getter for default options
		driveOptions: function(options) {
			// setter
			if (typeof options === 'object') {
				this.extend(this._jquerydrive.options, options);
			}

			return this._jquerydrive.options;
		}
	});

	$.extend($.DriveClass.prototype, {
		// initialize all config
		init: function(cfg) {

			// prepare config object!
			this.cfg = cfg || {'$': window.jQuery};

			// the jQuery object
			this.$ = this.cfg.$ || window.jQuery;

			// get default options object
			var options = this.$.driveOptions();

			// build config object
			this.$.each(options, function(key, val) {
				if (!cfg[key]) {
					cfg[key] = val;
				}
			});

			// quick reference of elements
			this.cfg.elements = cfg.elements || this.$(this.cfg.selector, this.cfg.context);
			this._elements = this.cfg.elements;

			return this;
		},

		// main method
		exec: function( ) {

			var self = this;

			if (!self.cfg.elements.size()) {
				// proceed!
				self.tryCatch(function() {
					self
					  .makeSelectorList()
					    .drivePath()
					      .runCallback();
				});
			}

			return self;
		},

		// prepare selector list to create elements
		makeSelectorList: function( ) {

			var self = this;

			var selector;

			if (self.cfg.selector instanceof self.$) {
				// stringify selector. this would only work with jQuery 1.3 and higher...
				selector = self.cfg.selector.selector;
			} else {
				selector = self.cfg.selector;
			}

			// validate selector(will throw exception if not ok)
			self.validateSelector(selector);

			// get only the 1st selector if multiple
			selector = selector.split(',')[0];

			// prepare selectors list
			self._selectorList = self.$.trim(selector).split(' ');

			return self;
		},

		// custom selector validator for Drive plugin
		validateSelector: function(selector) {
			selector = selector.replace(/\\\[|\\\]|\\\:|\\\*|\\\~|\\\+/, '');

			if (selector.search(/\[|\]|\:|\*|\~|\+/) > -1) {
				throw('selector must not contain special characters');
			}

			return this;
		},

		// create missing elements
		drivePath: function( ) {

			var self = this;

			// prepare the head "container" element
			var headContainer;
			if (self.$(self.cfg.context).size()) {
				// array of elements: use the first one
				var firstNode = self.$(self.cfg.context).get(0);

				if (firstNode.tagName) {
					// DOM element
					headContainer = self.$(firstNode);
				} else {
					// not a DOM element
					headContainer = self.$('body');
				}
			} else {
				// unknown context
				headContainer = self.$('body');
			}

			// selector accumulator
			var selectorAcc = [];

			// build the structure
			for (var i = 0, len = self._selectorList.length; i < len; i++) {
				if (self._selectorList[i]) {
					selectorAcc.push(self._selectorList[i]);

					// "parent > child" operator
					if (self._selectorList[i] == '>') {
						continue;
					}

					var currentSelector = selectorAcc.join(' ');
					var currentElements = self.$(currentSelector, self.cfg.context);

					if (currentElements.size()) {
						// the case we found at least 1 element
						// if we have many elements, we take the first one
						headContainer = self.$(currentElements.get(0));
					} else {
						// the case we need to create new elements
						var node = self.getNode(self.toObj(self._selectorList[i]));

						// insert node inside head container
						if (self.cfg.insertMethod == 'prepend') {
							headContainer.prepend(node);
						} else {
							headContainer.append(node);
						}

						// current node becomes head container
						headContainer = node;
					}
				}
			}

			// reset elements reference
			self._elements = self.$(self.cfg.selector, self.cfg.context);

			return self;
		},

		// convert a selector string into an object
		toObj: function(selector) {

			var self = this;
			var $ = self.$;
			var obj = {};

			// lets assume we have basic selector format: "tag#id.class1.class2"
			// or should we do validation ??

			// match cases taken from the Sizzle Selector Engine
			var _match = {
				ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
				CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
				TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/
			};
			// all match results
			var _result = {};

			// run all regexps against selector
			$.each(_match, function(key, val) {
				_result[key] = selector.search(val);
			});

			// get classes if applicable
			if (_result.CLASS > -1) {
				var classString = selector.substr(_result.CLASS + 1);
				obj._class = classString.split('.');

				// cut-off selector
				selector = selector.substr(0, selector.length - classString.length - 1);
			}

			// get id if applicable
			if (_result.ID > -1) {
				var tmp = selector.split('#');
				obj._id = tmp[1];

				// cut-off selector
				selector = tmp[0];
			}

			// get tag
			if (_result.TAG > -1) {
				obj._tag = selector;
			} else {
				obj._tag = self.cfg.defaultTag;
			}

			obj._attr = this.cfg.attr;
			obj._css = this.cfg.css;

			return obj;
		},

		// return a new DOM element
		getNode: function(obj) {

			var $ = this.$;

			// prepare input type if applicable
			var inputType = obj._tag.search(/input/i) > -1 ? (' type="' + this.cfg.inputType + '"') : '';

			// create DOM element
			var node = $('<' + obj._tag + inputType + ' />');

			// set id if applicable
			if (obj._id) {
				node.attr('id', obj._id);
			}

			// set attributes
			$.each(obj._attr, function(key, val) {
				node.attr(key, val);
			});

			// set css classes if applicable
			if (obj._class) {
				for (var i = 0, len = obj._class.length; i < len; i++) {
					node.addClass(obj._class[i]);
				}
			}

			// set inline style if applicable
			node.css(obj._css);

			// bind callbacks
			node
			  .bind('drive:success', this.cfg.success)
			    .bind('drive:failure', this.cfg.failure);

			return node;
		},

		// run callback if applicable
		runCallback: function( ) {

			var self = this;

			var size = self._elements.size();

			// note: triggered event will bubble all the way through all created DOM elements
			self._elements.trigger((size ? 'drive:success' : 'drive:failure'), [self]);

			return self;
		},

		// try to execute a function
		tryCatch: function(fn) {
			try {
				fn();
			} catch(err) {
				// bind this._elements context to except callback
				this._elements._jquerydrive_except = this.cfg.except;
				// execute callback with cfg object and js runtime error object
				this._elements._jquerydrive_except(err, this);

				// exception occurred
				return false;
			};

			// no exception
			return true;
		},

		// return the final element(s)
		getElements: function( ) {
			return this._elements;
		}
	});

	/**** end of main class for Drive jQuery plugin ****/

	$.extend({
		drive: function(arg1, arg2, arg3) {
			var $ = this;

			// prepare config object
			var cfg = {};

			if (typeof arg1 == 'object') {
				cfg = arg1;
				var elements = $(cfg.selector, cfg.context);

				// force these parameters
				$.extend(cfg, {
					'$': $,
					'elements': elements
				});
			} else {
				// var selector = arg1;
				var context = $.isFunction(arg2) ? document : arg2;
				var callback = $.isFunction(arg2) ? arg2 : arg3;

				// force these parameters
				$.extend(cfg, {
					'selector': arg1,
					'context': context,
					'$': $,
					'elements': $(arg1, context),
					'success': callback
				});
			}

			// return jQuery object using DriveClass
			return new $.DriveClass(cfg).exec().getElements();
		}
	});

	// check for jQuery 1.3.x or higher
	if($('#_selector_test').selector) {
		$.fn.extend({
			drive: function(arg1) {
				if (this.selector) {
					// prepare config object
					var cfg = {};

					// do we have a function of an object?
					if (jQuery.isFunction(arg1)) {
						cfg.success = arg1;
					} else if (typeof arg1 == 'object') {
						cfg = arg1;
					}

					// force these parameters
					jQuery.extend(cfg, {
						'selector': this.selector,
						'context': this.context,
						'$': jQuery,
						'elements': this
					});

					// return jQuery object using DriveClass
					return new jQuery.DriveClass(cfg).exec().getElements();
				}
				return this;
			}
		});
	};

})(jQuery);
