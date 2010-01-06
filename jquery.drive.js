
// Drive jQuery plugin v0.1.0

// Copyright (c) 2009 Laurent Fortin
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
    
    DriveClass: function(cfg) {
      this.init(cfg);
    }
    
  });
  
  $.extend($.DriveClass.prototype, {
    
    // initialize all config
    init: function(cfg) {
      
      // prepare config object!
      this.cfg = cfg || {'$': window.jQuery};
      
      // the jQuery object
      this.$ = this.cfg.$ || window.jQuery;
      
      // selector
      this.cfg.selector = cfg.selector || '';
      
      // context
      this.cfg.context = cfg.context || document;
      
      // quick reference of elements
      this.cfg.elements = cfg.elements || this.$(this.cfg.selector, this.cfg.context);
      this._elements = this.cfg.elements;
      
      // default type of DOM element to create
      this.cfg.defaultTag = cfg.defaultTag || 'div';
      
      // attributes to apply
      this.cfg.attr = cfg.attr || {};
      
      // inline style to apply
      this.cfg.css = cfg.css || {};
      
      // callback in case all went successful
      this.cfg.success = this.$.isFunction(cfg.success) ? cfg.success : function(){ };
      
      // callback in case we could not complete the elements creation
      this.cfg.failure = this.$.isFunction(cfg.failure) ? cfg.failure : function(){ };
      
      // callback in case a JavaScript error was caught
      this.cfg.except = this.$.isFunction(cfg.except) ? cfg.except : function(){ };
      
      return this;
    },
    
    // main method
    exec: function( ) {
      
      var self = this;
      
      if(!self.cfg.elements.size()) {
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
      
      if(self.cfg.selector instanceof self.$) {
        // stringify selector. this would only work with jQuery 1.3 and higher...
        selector = self.cfg.selector.selector;
      } else {
        selector = self.cfg.selector;
      }
      
      // validate selector(will throw exception if not ok)
      self.validateSelector(selector);
      
      // get only the 1st selector if multiple
      selector = selector.split(',')[0];
      
      // remove "parent > child" operator
      //selector = selector.replace(/\>/, '');
      
      // prepare selectors list
      self._selectorList = self.$.trim(selector).split(' ');
      
      return self;
    },
    
    // custom selector validator for Drive plugin
    validateSelector: function(selector) {
      selector = selector.replace(/\\\[|\\\]|\\\:|\\\*|\\\~|\\\+/, '');
      
      if(selector.search(/\[|\]|\:|\*|\~|\+/) > -1) {
        throw('selector must not contain special characters');
      }
      
      return this;
    },
    
    // create missing elements
    drivePath: function( ) {
      
      var self = this;
      
      // prepare the head "container" element
      var headContainer;
      if(self.cfg.context.tagName) {
        // raw DOM element
        headContainer = self.$(self.cfg.context);
      } else if(self.$(self.cfg.context).size() > 1) {
        // array of elements: use the first one
        headContainer = self.$(self.$(self.cfg.context).get(0));
      } else {
        // document or unknown context
        headContainer = self.$('body');
      }
      
      // selector accumulator
      var selectorAcc = [];
      
      // build the structure
      for(var i = 0, len = self._selectorList.length; i < len; i++) {
        if(self._selectorList[i]) {
          selectorAcc.push(self._selectorList[i]);
          
          // "parent > child" operator
          if(self._selectorList[i] == '>') {
            continue;
          }
          
          var currentSelector = selectorAcc.join(' ');
          var currentElements = self.$(currentSelector, self.cfg.context);
          
          if(currentElements.size()) {
            // the case we found at least 1 element
            // if we have many elements, we take the first one
            headContainer = self.$(currentElements.get(0));
          } else {
            // the case we need to create new elements
            var node = self.getNode(self.toObj(self._selectorList[i]));
            // append node inside head container
            headContainer.append(node);
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
      if(_result.CLASS > -1) {
        var classString = selector.substr(_result.CLASS + 1);
        obj._class = classString.split('.');
        
        // cut-off selector
        selector = selector.substr(0, selector.length - classString.length - 1);
      }
      
      // get id if applicable
      if(_result.ID > -1) {
        var tmp = selector.split('#');
        obj._id = tmp[1];
        
        // cut-off selector
        selector = tmp[0];
      }
      
      // get tag
      if(_result.TAG > -1) {
        obj._tag = selector;
      } else {
        obj._tag = self.cfg.defaultTag;
      }
      
      obj._attr = this.cfg.attr;
      obj._css = this.cfg.css;
      
      return obj;
    },
    
    // return a tag to use
    getTag: function(obj) {
      
      // here, we try to figure out which tag to use
      if(obj.tag) return obj.tag;
      
      // see if a tag is associated with a class
      /*
        here we should try other techniques to guess a tag before giving up ...
      http://snippets.dzone.com/posts/show/3737
	if (document.styleSheets[0].cssRules)  // Standards Compliant
        {
	   thecss = document.styleSheets[0].cssRules;
        }
	else
        {
        thecss = document.styleSheets[0].rules;  // IE
        }
      */
      
      return this.cfg.defaultTag;
    },
    
    // return a new DOM element
    getNode: function(obj) {
      
      var $ = this.$;
      
      // create DOM element
      var node = $('<' + obj._tag + ' />');
      
      // set id if applicable
      if(obj._id) {
        node.attr('id', obj._id);
      }
      
      // set attributes
      $.each(obj._attr, function(key, val) {
        node.attr(key, val);
      });
      
      // set css classes if applicable
      if(obj._class) {
        $.each($.makeArray(obj._class), function() {
          node.addClass(this);
        });
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
      
      // with jQuery 1.3.x or higher, we can use jQuery.Event
      /***
      var event = (function(eventType) {
        if(self.$.Event) {
          //return self.$.extend(event, {drive: self});
          return {
            type: eventType,
            drive: self
          };
        } else {
          return eventType;
        }
      })(size ? 'drive:success' : 'drive:failure');
      ***/
      
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
      
      if(typeof arg1 == 'object') {
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
        if(this.selector) {
          // prepare config object
          var cfg = {};
          
          // do we have a function of an object?
          if(jQuery.isFunction(arg1)) {
            cfg.success = arg1;
          } else if(typeof arg1 == 'object') {
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