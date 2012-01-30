describe("Drive jQuery plugin", function() {

  var success         = false,
      successCallback = function() {
                          success = true;
                        };

  beforeEach(function() {
    success = false;
    $.driveOptions({ defaultTag : 'div' });
  });

  describe("As a jQuery function", function() {

    it("should accept selector as object parameter", function() {
      $.drive({
        selector : '#container #div-0.middle-size.bg-green',
        success  : successCallback
      });

      expect(success).toBeTruthy();
      expect($('#container #div-0.middle-size.bg-green').size()).toBeTruthy();
    });

    it("should accept selector and context as object parameter", function() {
      $.drive({
        selector : 'div#div-1.middle-size.bg-blue',
        context  : '#container',
        success  : successCallback
      });

      expect(success).toBeTruthy();
      expect($('#container #div-1.middle-size.bg-blue').size()).toBeTruthy();
    });

    it("should accept selector argument", function() {
      $.drive('#container div#div-2.middle-size.bg-red', successCallback);

      expect(success).toBeTruthy();
      expect($('#container #div-2.middle-size.bg-red').size()).toBeTruthy();
    });

    it("should accept selector and context arguments", function() {
      $.drive('#div-3.middle-size.bg-green', $('#container'), successCallback);

      expect(success).toBeTruthy();
      expect($('#container #div-3.middle-size.bg-green').size()).toBeTruthy();
    });

  });

  describe("As a jQuery method", function() {

    it("should accept selector", function() {
      $('#container div#div-4.middle-size.bg-blue').drive(successCallback);

      expect(success).toBeTruthy();
      expect($('#container #div-4.middle-size.bg-blue').size()).toBeTruthy();
    });

    it("should accept selector and 'jQuery set' context", function() {
      $('#div-5.middle-size.bg-red', $('#container')).drive(successCallback);

      expect(success).toBeTruthy();
      expect($('#container #div-5.middle-size.bg-red').size()).toBeTruthy();
    });

    it("should accept selector and 'DOM element' context", function() {
      $('#div-6.middle-size.bg-green span', $('#container').get(0)).drive(successCallback);

      expect(success).toBeTruthy();
      expect($('#container #div-6.middle-size.bg-green span').size()).toBeTruthy();
    });

    it("should support selector with parent/child operator", function() {
      $('#container #div-7.middle-size.bg-blue > span').drive(successCallback);

      expect(success).toBeTruthy();
      expect($('#container #div-7.middle-size.bg-blue > span').size()).toBeTruthy();
    });

    it("should create input fields", function() {
      $('#container #div-8.middle-size.bg-red > form > input').drive(successCallback);

      expect(success).toBeTruthy();
      expect($('#container #div-8.middle-size.bg-red > form > input').size()).toBeTruthy();
    });

    it("should animate created elements with effect as argument", function() {
      $('#container #div-9.middle-size.bg-green').drive('fadeIn', 'slow');

      expect($('#container #div-9.middle-size.bg-green').is(':animated')).toBeTruthy();
    });

    it("should accept explicit options object", function() {
      $.driveOptions({ defaultTag : 'span' });

      $('#container #div-10.middle-size.bg-blue form').drive({ html : '<a href="#">link</a>' });
      $('#container #div-10.middle-size.bg-blue form button').drive();
      $('#div-10.middle-size.bg-blue form input').drive({
                                                          context      : '#container',
                                                          inputType    : 'checkbox',
                                                          insertMethod : 'prepend',
                                                          showMethod   : ['fadeIn', 500],
                                                          attr         : { 'custom-attr': 'test' },
                                                          css          : { 'position': 'absolute' },
                                                          force        : true,
                                                          success      : successCallback,
                                                          except       : function(e, drive) {
                                                                           console.debug(e);
                                                                         }
                                                        });

      expect(success).toBeTruthy();
      expect($('#container #div-10.middle-size.bg-blue form input').size()).toBeTruthy();
      expect($('#container #div-10.middle-size.bg-blue').is('span')).toBeTruthy();
      expect($('#container #div-10.middle-size.bg-blue form input').is(':checkbox')).toBeTruthy();
      expect($('#container #div-10.middle-size.bg-blue form > *').first().is('input')).toBeTruthy();
      expect($('#container #div-10.middle-size.bg-blue form input').is(':animated')).toBeTruthy();
      expect($('#container #div-10.middle-size.bg-blue form input').attr('custom-attr')).toEqual('test');
      expect($('#container #div-10.middle-size.bg-blue form input').css('position')).toEqual('absolute');
      expect($('#container #div-10.middle-size.bg-blue form a').attr('href')).toEqual('#');

    });

  });

});