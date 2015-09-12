;(function ($) {

	//
	// Variables
	//

	var settingBreakpoint 					= false
	  , supportsOrientationChange 	= 'ontouchstart' in window
	  , orientationEvent 						= supportsOrientationChange ? 'orientationchange' : 'resize'
	  , devicePixelRatio 						= 'devicePixelRatio' in window ? window.devicePixelRatio : 1
	  // General functions
    , SliderBox	= function SliderBox (elem, options, callback) {
				//
				// Variables
				//

				var carousel = $(elem)
					, placeholder = carousel.find('.placeholder')
					, options = options || {}
					, settings = $.extend({}, $.fn.sliderBox.defaults, options)
					, _touches = {
							'touchstart'	: {'x' : -1, 'y' : -1}
						, 'touchmove' 	: {'x' : -1, 'y' : -1} 
						, 'touchend'  	: false
						, 'direction' 	: 'undetermined'
					}
					, interval
					// Api functions
					, api = {
							addSlides : function addSlides (jsonData) {
								var htmlTemplate = $('.item', placeholder).eq(0).clone()
									, firstAdded;

								if ('breakpoints' in settings) {
									viewPortWidth 	= getViewportWidthInCssPixels();
									breakpoint 		= getBreakpoint(settings.breakpoints, viewPortWidth);
									breakpointVal = !api.isEmpty(breakpoint)
										? breakpoint.folder - 0
										: elBreakpointVal = settings.defaultBreakpoint.folder;
								}

								for (var i = 0; i < jsonData.length; i++) {
									for (var key in jsonData[i]) {
										if (key === 'img') {
											if ('breakpoints' in settings) {
												htmlTemplate.attr('data-img', jsonData[i][key]['src'])
													.attr('data-breakpoint', jsonData[i][key]['folder'])
													.find('img').attr('src',
														('path' in settings && settings.path === 'absolute' ? '/' : '')
														+ jsonData[i][key]['folder']
															.replace('{folder}', breakpointVal)
														+ jsonData[i][key]['src']
													);
											} else {
												htmlTemplate.find('img').attr('src',
													('path' in settings && settings.path === 'absolute' ? '/' : '')
														+ jsonData[i][key]['folder']
														+ jsonData[i][key]['src']);
											}
										} else {
											$('.item .' + key, htmlTemplate).html(jsonData[i][key]);
										}
									}

									placeholder.append(htmlTemplate);
									if (!i) firstAdded = $('.item', placeholder).length - 1;
								}

								reinit();
								moveToSlide('goto', firstAdded);
							}
							, isEmpty: function isEmpty (obj) {
									for (var prop in obj) {
										if (obj.hasOwnProperty(prop))
											return false;
									}

									return true;
								}
							, removeSlider: function removeSlider () {
								carousel.remove();
							}
							, startAuto : function startAuto () {
								if (!'auto' in settings || !settings.auto) settings.auto = 3000;

								interval = setInterval(function(){
									moveToSlide('next')
								}, settings.auto);
							}
							, stopAuto : function stopAuto () {
								clearInterval(interval);
							}
						}
					// underscore debounce function
					, debounce = function debounce(func, wait, immediate) {
							var timeout;

							return function() {
								var context = this
									, args 	= arguments
									, later 	= function() {
										timeout = null;
										if (!immediate) func.apply(context, args);
									}
									, callNow = immediate && !timeout;

								clearTimeout(timeout);
								timeout = setTimeout(later, wait);
								if (callNow) func.apply(context, args);
							};
						}

					 /*
					 * Returns the layout viewport width in CSS pixels.
					 * To achieve a precise result the following meta must be included at least:
					 * <meta name="viewport" content="width=device-width">
					 * See:
					 * - http://www.quirksmode.org/mobile/viewports2.html
					 * - http://www.quirksmode.org/mobile/tableViewport.html
					 * - https://github.com/h5bp/mobile-boilerplate/wiki/The-Markup
					 */
					, getViewportWidthInCssPixels = function getViewportWidthInCssPixels() {
							var  i 			= 0
								, math 		= Math
								, screenWidth = window.screen.width
								, widths 		= [
									window.innerWidth
									, window.document.documentElement.clientWidth
									, window.document.documentElement.offsetWidth
									, window.document.body.clientWidth
								]
								, width;

							for (; i < widths.length; i++) {
								// If not a number remove it
								if (isNaN(widths[i])) {
									widths.splice(i, 1);
									i--;
								}
							}

							if (widths.length) {
								width = math.max.apply(math, widths);

								// Catch cases where the viewport is wider than the screen
								if (!isNaN(screenWidth)) {
									width = math.min(screenWidth, width);
								}
							}

							return width || screenWidth || 0;
						}

					// https://gist.github.com/localpcguy/1373518
					, setBreakpoint = function setBreakpoint(carousel) {
							var breakpoint
								, breakpointVal
								, elemHeight
								, elemWidth
								, elSlides
								, placeholder
								, viewPortWidth;

							api.stopAuto();

							if (!carousel.data('busyAnimating')) {
								viewPortWidth 		= getViewportWidthInCssPixels();
								breakpoint 				= getBreakpoint(settings.breakpoints, viewPortWidth);
								elemWidth 				= carousel.parent().width();
								placeholder 			= $('.placeholder', carousel);
								elSlides 					= $('.item', placeholder);
								settingBreakpoint = false;

								breakpointVal = !api.isEmpty(breakpoint)
									? breakpoint.folder - 0
									: elBreakpointVal = settings.defaultBreakpoint.folder;

								carousel.width(elemWidth); 
								elSlides.width(elemWidth);
								placeholder.css({
									'marginLeft' 	: (0 - (elemWidth * settings.currentSlide))
									, 'width' 		: (elemWidth * elSlides.length)
								});

								if (breakpointVal !== settings.currentBreakpoint) {
									elSlides.each(function (index, el) {
										var elSlide			 	= $(el)
											, attrDataBreakpoint 	= elSlide.attr('data-breakpoint')
											, slideImg 			= elSlide.find('img');

										if (slideImg.length) {
											if (index === settings.currentSlide) {
												slideImg.one('load', function () {
													sliderHeight(carousel);
												});
											}

											if (typeof attrDataBreakpoint !== 'undefined' && attrDataBreakpoint !== false) {
												slideImg.attr('src',
													('path' in settings && settings.path === 'absolute' ? '/' : '')
													+ (attrDataBreakpoint	+ this.getAttribute('data-img'))
														.replace('{folder}', breakpointVal)
												);
											}
										} else {
											if (index === settings.currentSlide) sliderHeight(carousel);
										}
									});
								
									settings.currentBreakpoint = breakpointVal;
								} else {
									sliderHeight(carousel);
								}
								
								if (settings.auto) api.startAuto();
							} else {
								setTimeout(function () {
									setBreakpoint(carousel);
								}, 250);
							}
						}

					, getBreakpoint = function getBreakpoint(breakpoints, vWidth) {
							var _vWidth 	= vWidth
								 , i 			= 0
								 , breakpoint = {}
								 , _breakpoint
								 , minWidth
								 , maxWidth
								 , minDpr;

							while (_breakpoint = breakpoints[i]) {
								minWidth = _breakpoint['minWidth'];
								maxWidth = _breakpoint['maxWidth'];
								minDpr   = 'minDevicePixelRatio' in _breakpoint ? _breakpoint['minDevicePixelRatio'] : 0;

								// Viewport width found
								if (vWidth > 0) {
									if (minWidth && maxWidth  && vWidth >= minWidth && vWidth <= maxWidth ||
										minWidth && !maxWidth && vWidth >= minWidth ||
										maxWidth && !minWidth && vWidth <= maxWidth) {
										if (!minDpr || minDpr && devicePixelRatio >= minDpr) {
											breakpoint = _breakpoint;
										}
									}
								// Viewport width not found so let's find the smallest image size
								// (mobile first approach).
								} else if (_vWidth <= 0 || minWidth < _vWidth || maxWidth < _vWidth) {
									_vWidth 	= minWidth || maxWidth || _vWidth;
									breakpoint 	= _breakpoint;
								}
								i++;
							}

							return breakpoint;
						}

					, createNav = function createNav (carousel, navigation) {
							if (!navigation && !supportsOrientationChange) {
								carousel.prepend('<nav aria-controls="carousel"><a href="#" class="prev" aria-label="previous" rel="prev">&lt;</a> <a href="#" class="next" rel="next" aria-label="next">&gt;</a></nav>');
							} else {
								var $sliderNav = $('<nav class="slider-nav ' + navigation + '" aria-controls="carousel"><ul></ul></nav>'); 

								for (var i = 0; i < $('.item', carousel).length; i++) {
									$('ul', $sliderNav).append('<li><a class="navigate" href="#">' + i + '</a></li>');
								}

								$('a.navigate', $sliderNav).eq(0).addClass('active');
								carousel.append($sliderNav);
							}
						}
					, removeSlider = function removeSlider (carousel) {
							carousel.remove();
						}

					, sliderHeight = function sliderHeight (carousel) {
							var elemHeight = $('.item', carousel).eq(settings.currentSlide).outerHeight();

							carousel.animate({'height' : elemHeight});
						}
					, error = function error (msg) {
							throw new Error( msg );
						};

				if ('breakpoints' in settings && !settings.responsive)
					settings.responsive = true;
				
				//
				// Functions
				//

				function moveToSlide (direction, num) {
					if (!settingBreakpoint) {
						var carouselWidth = carousel.width()
							, items = $('.item', placeholder)
							, last = items.length - 1
							, moveTo;

						// accessibility
						items.eq(settings.currentSlide).attr('aria-hidden', 'false');
						items.not(':eq(' + settings.currentSlide + ')').attr('aria-hidden', 'true');

						carousel.data('busyAnimating', true);

						switch (direction) {
							case 'prev':
								settings.currentSlide = settings.currentSlide === 0
									? last
									: settings.currentSlide - 1;

								moveTo = {
									marginLeft: -(carouselWidth * settings.currentSlide)
								};
								break;
							case 'next':
								settings.currentSlide = settings.currentSlide === last
									? 0
									: settings.currentSlide + 1;

								moveTo = {
									marginLeft: -(carouselWidth * settings.currentSlide)
								};
								break;
							case 'goto':
								settings.currentSlide = num;
								moveTo = {
									marginLeft: -(carouselWidth * num)
								};
								break;
						}

						if (settings.navigation) {
							$('.slider-nav a', carousel).removeClass('active')
								.eq(settings.currentSlide).addClass('active');
						}

						placeholder.animate(moveTo, settings.speed, function () {
							carousel.data('busyAnimating', false);
							sliderHeight(carousel);
						});
					} else {
						setTimeout(function () {
							moveToSlide(direction, num);
						}, 100);
					}
				}

				function onComplete (waitForAllImages, callback) {
					var elems = carousel.add(carousel.find('img')).filter('img')
						, numberOfRemainingImages = elems.length;

					if (!numberOfRemainingImages) {
						callback();
						return;
					}

					elems.each(function () {
						var that = this
							, jQueryThat 		= $(that)
							, events 			= 'load error'
							, loadFunction 	= function () {
								jQueryThat.off(events, loadFunction);

								if (waitForAllImages) {
									numberOfRemainingImages--;
									if (numberOfRemainingImages == 0) {
										callback();
									}
								} else {
									callback();
								}
							};

						jQueryThat.on(events, loadFunction);
						/*
						 * Start ugly working IE fix.
						 */
						if (that.readyState == 'complete') {
							jQueryThat.trigger('load');
						} else if (that.readyState) {
							// Sometimes IE doesn't fire the readystatechange, even though the readystate has been changed to complete. AARRGHH!! I HATE IE, I HATE IT, I HATE IE!
							that.src = that.src; // Do not ask me why this works, ask the IE team!
						}
						/*
						 * End ugly working IE fix.
						 */
						else if (that.complete) {
							jQueryThat.trigger('load');
						}
						else if (that.complete === undefined) {
							var src = that.src;
							// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
							// data uri bypasses webkit log warning (thx doug jones)
							that.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
							that.src = src;
						}
					});
				}

				function touchHandler (event) {
					var touch
						, xSwipe
						, ySwipe;

					if (typeof event !== 'undefined'){	
						// for vanilla javascript use event.touches
						if (typeof event.originalEvent.touches !== 'undefined') {
							touch = event.originalEvent.touches[0];

							switch (event.originalEvent.type) {
								case 'touchstart':
								case 'mousedown':
									_touches[event.originalEvent.type].x = touch.pageX;
									_touches[event.originalEvent.type].y = touch.pageY;
									break;
								case 'touchmove':
								case 'mousemove':
									_touches[event.originalEvent.type].x = touch.pageX;
									_touches[event.originalEvent.type].y = touch.pageY;
									break;
								case 'touchend':
								case 'mouseup':
									if (!carousel.data('busyAnimating')) {
										_touches[event.originalEvent.type] = true;

										if (_touches.touchstart.x > -1 && _touches.touchmove.x > -1) {
											xSwipe = Math.abs(_touches.touchstart.x - _touches.touchmove.x);
											ySwipe = Math.abs(_touches.touchstart.y - _touches.touchmove.y);

											if (xSwipe > ySwipe && xSwipe > (getViewportWidthInCssPixels() * .33)) {
												_touches.direction = _touches.touchstart.x < _touches.touchmove.x ? 'left' : 'right';
												
												if (_touches.direction === 'left') {
													moveToSlide('prev');
												} else if (_touches.direction === 'right') {
													moveToSlide('next')
												}
											}
										}
									}
									break;
							}
						}
					}
				}

				function init () {
					var items =  $('.item', carousel);
					// accessibility
					items.eq(settings.currentSlide).attr('aria-hidden', 'false');
					items.not(':eq(' + settings.currentSlide + ')').attr('aria-hidden', 'true');

					createNav(carousel, settings.navigation);

					if (settings.responsive
					&& settings.breakpoints.constructor === Array
					&& settings.breakpoints.length) {
						setBreakpoint(carousel);
					} else {
						onComplete(false, function () {
							var itemWidth = carousel.width()
								, placeholderWidth = items.length * itemWidth;

							items.width(itemWidth);
							$('.placeholder', carousel).width(placeholderWidth);

							sliderHeight(carousel);
						});
					}

					if ('onComplete' in settings) onComplete(true, settings.onComplete);

					//
					// Events
					//
					carousel.on('click', '.navigate', function (e) {
						e.preventDefault();

						var num = $('.navigate', carousel).index(this);
						moveToSlide('goto', num);
					}).on('keypress', function (e) {
						// manage focus and keyboard accessibility.
						if (e.which == 13) {
							$(this).click();
							e.preventDefault(); 
						}
					});

					if (supportsOrientationChange) {
						//https://gist.github.com/localpcguy/1373518
						carousel.on('touchstart touchmove touchend', function (e) {
							touchHandler(e);
							api.stopAuto();
						});
					} else {
						carousel.on('click', '.prev, .next', function (e) {
							e.preventDefault();
							api.stopAuto();
							moveToSlide(this.rel);
						}).on('keypress', function (e) {
							// manage focus and keyboard accessibility.
							if (e.which == 13) {
								$(this).click();
								e.preventDefault(); 
							}
						});
					}

					if (settings.responsive) {
						$(window).on(orientationEvent, debounce(function () {
							setBreakpoint(carousel);
						}, 250));
					}

					$(window).on(orientationEvent, debounce(function () {
						sliderHeight(carousel);
					}, 250));
				}

				function reinit () {
					var items = $('.item', placeholder)
						, newWidth = items.length * items.eq(0).width();

					options.currentSlide = items.length - 1;
					placeholder.width(newWidth);
				}

				//
				// Initialize
				//
				if ('ajax' in settings) {
					$.ajax({
							url       : settings.ajax
						, dataType  : 'json'
					}).done(function (response) {
						var elClone = $('.item', carousel).eq(0)
							, $clone
							, errorMessage = 'No slides found, or misformatted json response.';

						if ('slides' in response) {
							$('.loading', carousel).remove();

							for (var i = 0; i < response.slides.length; i++) {
								$clone = elClone.clone();

								for (var key in response.slides[i]) {
									if (key === 'image') {
										if (settings.responsive) {
											$clone.attr('data-breakpoint', response.slides[i]['image'].path)
												.attr('data-img',  response.slides[i]['image'].img);
										} else {
											$clone.find('img').attr('src', response.slides[i]['image'].path + response.slides[i]['image'].img)
										}
									} else {
										$clone.find('.' + key).html(response.slides[i][key]);
									}
								}

								placeholder.append($clone);
								if (!('image' in response.slides[i])) {
									$('.item', placeholder).last().find('img').remove();
								}
							}

							$('.item', carousel).eq(0).remove();
							init();
						} else {
							$('.loading', carousel).html(errorMessage);
							return error(errorMessage);
						}
					});
				} else {
					init();
				}	

				return api;
			};
	
	$.fn.sliderBox = function (options, callback) {
		return this.each(function(key, value){
			var carousel = $(this);
			// Return early if this element already has a plugin instance
			if (carousel.data('sliderBox')) return carousel.data('sliderBox');
			var sliderBox = new SliderBox(this, options, callback);
			carousel.data({
				busyAnimating : false
			, sliderBox			: sliderBox
			});
		});
	};
	
	$.fn.sliderBox.defaults = {
		auto 							: false
	  , breakpoints 		: [
				{folder: '480', maxWidth: 480}
		  , {folder: '640', minWidth: 481, maxWidth: 767}
		  , {folder: '900', minWidth: 748} // tablet and desktop
		  , {folder: '1170', minWidth: 992}
		  , {folder: '640', maxWidth: 320, minDevicePixelRatio: 2} // iPhone 4 Retina display
		  , {folder: '1170', minWidth: 320, maxWidth: 667, minDevicePixelRatio: 2} // iPhone 5/6 Retina display
		  , {folder: '2048', minWidth: 748, maxWidth: 1024, minDevicePixelRatio: 2} // tablet Retina display
		  , {folder: '2048', minWidth: 414, maxWidth: 736, minDevicePixelRatio: 3} // iPhone 6 PLUS Retina display
		]
	  , currentSlide 			: 0
	  , currentBreakpoint : 0
		, defaultBreakpoint	: {folder: '1170'} // todo documentation
	  , navigation				: false
	  , responsive				: false
	  , speed 						: 500
	};

})(jQuery);