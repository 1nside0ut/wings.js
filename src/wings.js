/*!
 * Wings.
 * 
 * JavaScript UI library that draws on canvas, inspired on Java Swing.
 * 
 * @author manuelbarzi
 */
var Wings;
(function() {

	// shim layer with setTimeout fallback
	window.requestAnimFrame = (function() {
		return window.requestAnimationFrame
				|| window.webkitRequestAnimationFrame
				|| window.mozRequestAnimationFrame || function(callback) {
					window.setTimeout(callback, 1000 / 60);
				};
	})();

	/*
	 * Just j(ava)s(cript).
	 */
	var js;
	(function() {
		'use strict';

		js = {

			// existence

			not : function(obj) {
				return !obj;
			},

			notDefined : function(obj) {
				return obj === undefined;
			},

			// objects

			typeOf : function(obj) {
				return this.isFunction(obj) ? obj.name || Function.name
						: obj.constructor.name || Object.name;
			},

			isType : function(obj, type) {
				return obj instanceof type;
			},

			// arrays

			empty : function(arr) {
				return arr.length === 0;
			},

			notEmpty : function(arr) {
				return arr.length !== 0;
			},

			// functions

			/*
			 * Checks whether the object is a function.
			 */

			isFunction : function(obj) {
				return typeof obj === 'function';
			},

			// dom about

			/*
			 * Safety run on DOM loaded.
			 */
			run : function(func) {
				if (js.not(js.run._waiting))
					js.run._waiting = [];
				if (js.isFunction(func))
					js.run._waiting.push(func);
				if (js.not(js.run._firstCalled)) {
					window.addEventListener('load', js.run);
					return js.run._firstCalled = true;
				}
				if (js.not(document.body))
					return setTimeout(js.run, 1);
				if (js.not(js.run._running)) {
					js.run._running = js.run._waiting;
					js.run._waiting = [];
					for ( var i in js.run._running)
						js.run._running[i]();
					js.run._running = undefined;
					if (js.notEmpty(js.run._waiting))
						js.run();
				}
			}

		};
	})();

	/*
	 * Assert(ions).
	 */
	var assert;
	(function() {

		assert = {

			isTrue : function(condition, message) {
				this.isFalse(!condition, message);
			},

			isFalse : function(condition, message) {
				if (condition)
					throw new Error(message);
			},

			isType : function(obj, type) {

				if (!js.isType(type, Array))
					type = [ type ];

				var expected = js.typeOf(type[0]);
				var passes = js.isType(obj, type[0]);

				for (var i = 1; i < type.length; i++) {
					expected += ' or ' + js.typeOf(type[i]);
					passes |= js.isType(obj, type[i]);
				}

				this.isTrue(passes, 'expected ' + expected + ', but got '
						+ js.typeOf(obj));
			}
		};

	})();

	/*
	 * Elements.
	 */
	var elem;
	(function() {
		elem = {

			/*
			 * Gets element absolute location.
			 * 
			 * Raw alternative:
			 * 
			 * absoluteLocation : function(elem) { var loc = { x : 0, y : 0 };
			 * while (elem) { loc.x += (elem.offsetLeft - elem.scrollLeft +
			 * elem.clientLeft); loc.y += (elem.offsetTop - elem.scrollTop +
			 * elem.clientTop); elem = elem.offsetParent; } return loc; }
			 * 
			 */
			absoluteLocation : function(elem) {
				var rect = elem.getBoundingClientRect();
				return {
					x : rect.left,
					y : rect.top
				};
			}

		};

	})();

	/*
	 * Class.
	 * 
	 * An upgrade on simple class inheritance.
	 */
	var Class;
	(function() {

		// The base Class implementation (does nothing)
		Class = function Class() {
		};

		var initializing = false, fnTest = /xyz/.test(function() {
			xyz;
		}) ? /\b_super\b/ : /.*/;

		// Create a new Class that inherits from this class
		Class.extend = function(prop) {
			var _super = this.prototype;

			// Instantiate a base class (but only create the instance,
			// don't run the init constructor)
			initializing = true;
			var prototype = new this();
			initializing = false;

			// Copy the properties over onto the new prototype
			for ( var name in prop) {
				// Check if we're overwriting an existing function
				prototype[name] = typeof prop[name] == "function"
						&& typeof _super[name] == "function"
						&& fnTest.test(prop[name]) ? (function(name, fn) {
					return function() {
						var tmp = this._super;

						// Add a new ._super() method that is the same method
						// but on the super-class
						this._super = _super[name];

						// The method only need to be bound temporarily, so we
						// remove it when we're done executing
						var ret = fn.apply(this, arguments);
						this._super = tmp;

						return ret;
					};
				})(name, prop[name]) : prop[name];
			}

			// The dummy class constructor

			var Class;

			// All construction is actually done in the init method

			function construct() {
				if (!initializing && this.init)
					this.init.apply(this, arguments);
			}

			// Force eval to correctly inherit the name of the
			// constructor name (init), otherwise is not possible to set it (the
			// name of a function is read-only and it can only be defined at the
			// time it is declared; see
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)
			eval('Class = function '
					+ (prop.init && prop.init.name ? prop.init.name : 'Class')
					+ '() { construct.apply(this, arguments); };');

			// Populate our constructed prototype object
			Class.prototype = prototype;

			// Enforce the constructor to be what we expect
			Class.prototype.constructor = Class;

			// And make this class extendable
			Class.extend = arguments.callee;

			return Class;
		};

	})();

	/*
	 * 2D stuff.
	 */
	var Point, Size, Rectangle;
	(function() {

		/*
		 * Point.
		 */
		Point = Class.extend({

			init : function Point(x, y) {
				this.x = x || 0;
				this.y = y || 0;
			},

			toString : function() {
				return JSON.stringify(this);
			}
		});

		Point.sum = function(p, p2) {
			return new Point(p.x + p2.x, p.y + p2.y);
		};

		/*
		 * Size.
		 */
		Size = Class.extend({

			init : function Size(width, height) {
				this.width = width || 0;
				this.height = height || 0;
			},

			toString : function() {
				return JSON.stringify(this);
			}

		});

		/*
		 * Rectangle.
		 */
		Rectangle = Class.extend({

			init : function Rectangle(x, y, width, height) {
				this.x = x || 0;
				this.y = y || 0;
				this.width = width || 0;
				this.height = height || 0;
			},

			toString : function() {
				return JSON.stringify(this);
			}

		});
	})();

	var Component, Behavior, Border, Panel, Image, View, MouseDown, MouseMove, MouseClick, MouseUp, MouseDrag;
	(function() {

		/*
		 * Component class.
		 */
		Component = Class.extend({

			init : function Component() {

				this._parent = undefined;
				this._coords = new Rectangle();
				this._mouse = new MouseState();
				this._children = [];
				this._behaviors = [];
				this._visible = true;
			},

			_isPointed : function(p) {
				var pos = this.absoluteLocation(), pointed = pos.x <= p.x
						&& p.x <= pos.x + this._coords.width && pos.y <= p.y
						&& p.y <= pos.y + this._coords.height;
				return pointed;
			},

			_mouseEvent : function(behavior, event) {
				if (this._behaviors.length > 0) {
					for ( var i in this._behaviors) {
						var b = this._behaviors[i];
						if (b instanceof behavior) {
							b.action(event);
						}
					}
				}
			},

			_mouseMove : function(event) {
				if (this.visible()) {
					if (this._isPointed(event.location)) {
						this._mouseEvent(MouseMove, event);
						if (this._mouse.pressed) {
							this._mouse.dragging = true;
							this._mouseEvent(MouseDrag, event);
						}
					} else if (this._mouse.dragging)
						this._mouseEvent(MouseDrag, event);
					if (this._children.length > 0) {
						for ( var i in this._children) {
							this._children[i]._mouseMove(event);
						}
					}
				}
			},

			_mouseDown : function(event) {
				if (this.visible()) {
					if (this._isPointed(event.location)) {
						this._mouse.pressed = true;
						this._mouseEvent(MouseDown, event);
					}
					if (this._children.length > 0) {
						for ( var i in this._children) {
							this._children[i]._mouseDown(event);
						}
					}
				}
			},

			_mouseUp : function(event) {
				this._releaseMouse();
				if (this.visible()) {
					if (this._isPointed(event.location)) {
						this._mouseEvent(MouseUp, event);
					}
					if (this._children.length > 0) {
						for ( var i in this._children) {
							this._children[i]._mouseUp(event);
						}
					}
				}
			},

			_releaseMouse : function() {
				this._mouse.pressed = false;
				this._mouse.dragging = false;
				if (this._children.length > 0) {
					for ( var i in this._children) {
						this._children[i]._releaseMouse();
					}
				}
			},

			_mouseClick : function(event) {
				if (this.visible()) {
					if (this._isPointed(event.location)) {
						this._mouseEvent(MouseClick, event);
					}
					if (this._children.length > 0) {
						for ( var i in this._children) {
							this._children[i]._mouseClick(event);
						}
					}
				}
			},

			toString : function() {
				return js.typeOf(this);
			},

			width : function(width) {
				if (js.notDefined(width))
					return this._coords.width;
				this._coords.width = width;
			},

			height : function(height) {
				if (js.notDefined(height))
					return this._coords.height;
				this._coords.height = height;
			},

			size : function(width, height) {
				if (js.empty(arguments))
					return new Size(this._coords.width, this._coords.height);
				this.width(width);
				this.height(height);
			},

			add : function(that) {

				assert.isType(that, [ Component, Behavior ]);

				if (that instanceof Component) {
					this._children.push(that);
					that._parent = this;
				} else if (that instanceof Behavior) {
					this._behaviors.push(that);
				}

				return that;
			},

			visible : function(visible) {

				if (js.notDefined(visible))
					return this._visible;

				this._visible = visible;

			},

			/*
			 * Sets / gets the location on component.
			 * 
			 * This location is relative to its parent.
			 */
			location : function() {
				switch (arguments.length) {
				case 0:
					return new Point(this._coords.x, this._coords.y);
				case 1:
					var loc = arguments[0];
					this._coords.x = loc.x;
					this._coords.y = loc.y;
					break;
				case 2:
					this._coords.x = arguments[0];
					this._coords.y = arguments[1];
				}

			},

			parent : function() {
				return this._parent;
			},

			absoluteLocation : function() {
				if (this._parent) {
					return Point.sum(this.location(), this._parent
							.absoluteLocation());
				}
				return this.location();
			},

			_draw : function(ctx) {
				var loc = this.location();
				ctx.translate(loc.x, loc.y);
				this.draw(ctx);
				if (this._children.length > 0)
					for ( var i in this._children) {
						this._children[i]._draw(ctx);
					}
				ctx.translate(-loc.x, -loc.y);
			},

			draw : function(ctx) {
				// draw me
			}

		});

		function MouseState() {
			this.pressed = false;
			this.dragging = false;
		}

		/*
		 * View Event.
		 */
		function ViewEvent(event, offset) {
			this.location = new Point(event.clientX - offset.x, event.clientY
					- offset.y);
		}

		/*
		 * Behavior.
		 * 
		 * @param action the behavior associated action
		 */
		Behavior = Class.extend({
			init : function Behavior(action) {
				this.action = action;
			}
		});

		// mouse behaviors

		MouseDown = Behavior.extend({
			init : function MouseDown(action) {
				this._super(action);
			}
		});

		MouseMove = Behavior.extend({
			init : function MouseMove(action) {
				this._super(action);
			}
		});

		MouseUp = Behavior.extend({
			init : function MouseUp(action) {
				this._super(action);
			}
		});

		MouseDrag = Behavior.extend({
			init : function MouseDrag(action) {
				this._super(action);
			}
		});

		MouseClick = Behavior.extend({
			init : function MouseClick(action) {
				this._super(action);
			}
		});

		// comps

		/*
		 * Border.
		 */
		Border = Component.extend({

			init : function Border() {
				this._super();
				this._color = 'gray';
				this._borderColor = 'black';
				this._borderWidth = 1;
			},

			color : function(color) {
				if (js.not(color))
					return this._color;
				this._color = color;
			},

			borderColor : function(borderColor) {
				if (js.not(borderColor))
					return this._borderColor;
				this._borderColor = borderColor;
			},

			borderWidth : function(borderWidth) {
				if (js.not(borderWidth))
					return this._borderWidth;
				this._borderWidth = borderWidth;
			},

			draw : function(ctx) {
				ctx.beginPath();
				ctx.rect(0, 0, this.width(), this.height());
				ctx.fillStyle = this.color();
				ctx.fill();
				ctx.lineWidth = this.borderWidth();
				ctx.strokeStyle = this.borderColor();
				ctx.stroke();
			}
		});

		/*
		 * Panel.
		 */
		Panel = Border.extend({

			init : function Panel() {
				this._super();
				this.color('white');
			}

		});

		/*
		 * Im(a)g(e).
		 */
		Image = Component.extend({

			init : function Image(img) {
				this._super();
				this._img = img;
			},

			draw : function(ctx) {
				ctx.drawImage(this._img, 0, 0);
			}

		});

		/*
		 * Mouse Reaction.
		 */
		function MouseReaction(action, interval) {
			this._action = action;
			this._interval = interval;
			this._before = Date.now();
			this._now = null;
		}

		MouseReaction.prototype = {
			react : function(arg) {
				this._now = Date.now();
				if (this._now - this._before > this._interval) {
					this._action(arg);
					this._before = this._now;
				}
			}
		};

		/*
		 * View.
		 */
		View = Panel.extend({

			init : function View(canvas) {

				this._super();

				var self = this;

				this.width(canvas.width);
				this.height(canvas.height);

				this._ctx = canvas.getContext('2d');

				/*
				 * events handling through view component's tree.
				 */

				var mouseMove = new MouseReaction(function(event) {
					self._mouseMove(new ViewEvent(event, elem
							.absoluteLocation(canvas)));
					self.refresh();
				}, -1);

				window.addEventListener('mousemove', function(event) {
					mouseMove.react(event);
				});

				var mouseDown = new MouseReaction(function(event) {
					self._mouseDown(new ViewEvent(event, elem
							.absoluteLocation(canvas)));
					self.refresh();
				}, -1);

				window.addEventListener('mousedown', function(event) {
					mouseDown.react(event);
				});

				var mouseUp = new MouseReaction(function(event) {
					self._mouseUp(new ViewEvent(event, elem
							.absoluteLocation(canvas)));
					self.refresh();
				}, -1);

				window.addEventListener('mouseup', function(event) {
					mouseUp.react(event);
				});

				var mouseClick = new MouseReaction(function(event) {
					self._mouseClick(new ViewEvent(event, elem
							.absoluteLocation(canvas)));
					self.refresh();
				}, -1);

				window.addEventListener('click', function(event) {
					mouseClick.react(event);
				});

				setTimeout(function() {
					self.refresh();
				}, 100);

			},

			refresh : function() {
				if (js.empty(arguments)) {
					var self = this;
					window.requestAnimFrame(function() {
						self._ctx.clearRect(0, 0, self.width(), self.height());
						self._draw(self._ctx);
					});
				}
			}

		});

	})();

	// globalization

	Wings = {
		run : js.run,
		Class : Class,
		Point : Point,
		Size : Size,
		Rectangle : Rectangle,
		Component : Component,
		Behavior : Behavior,
		Border : Border,
		Panel : Panel,
		Image : Image,
		View : View,
		MouseDown : MouseDown,
		MouseMove : MouseMove,
		MouseClick : MouseClick,
		MouseUp : MouseUp,
		MouseDrag : MouseDrag
	};

})();
