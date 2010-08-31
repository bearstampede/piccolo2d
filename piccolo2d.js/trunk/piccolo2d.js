/*jslint white: true, browser: true, devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true */
/*
 * Copyright (c) 2008-2009, Piccolo2D project, http://piccolo2d.org
 * Copyright (c) 1998-2008, University of Maryland
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions
 * and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions
 * and the following disclaimer in the documentation and/or other materials provided with the
 * distribution.
 *
 * None of the name of the University of Maryland, the name of the Piccolo2D project, or the names of its
 * contributors may be used to endorse or promote products derived from this software without specific
 * prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
 
"use strict";

Array.prototype.pushAll = function (x) {
    for (var i = 0; i < x.length; i += 1) {
        this.push(x[i]);
    }
};

Array.prototype.remove = function (x) {
    var keepers = [];

    for (var i = 0; i < this.length; i += 1) {
        if (this[i] !== x) {
            keepers.push(this[i]);
        }
    }
  
    return keepers;
};

// Explicitly declaring classes introduced into the Global Scope
var PTransform, PBounds, PPoint, PActivity, PActivityScheduler, PRoot,
    PNode, PText, PImage, PInterpolatingActivity, PViewTransformActivity, 
    PTransformActivity, PLayer, PCanvas, PCamera;

(function () {
    var min = Math.min,
        max = Math.max,
        abs = Math.abs,
        sin = Math.sin,
        cos = Math.cos;
            
    PTransform = Class.extend({
        init: function (values) {
            this.values = values || [1, 0, 0, 1, 0, 0];
        },

        scale: function (ratio) {
            this.values[0] *= ratio;
            this.values[3] *= ratio;

            return this;
        },

        translate: function (dx, dy) {
            this.values[4] += dx;
            this.values[5] += dy;

            return this;
        },

        rotate: function (theta) {
            var c = cos(theta),
                s = sin(theta);

            this.transformBy([c, s, -s, c, 0, 0]);

            return this;
        },

        transformBy: function (t2) {
            var m1 = this.values,
                m2 = t2;

            if (t2 instanceof PTransform) {
                m2 = t2.values;
            }

            this.values = [];

            this.values[0] = m1[0] * m2[0] + m1[2] * m2[1];
            this.values[1] = m1[1] * m2[0] + m1[3] * m2[1];
            this.values[2] = m1[0] * m2[2] + m1[2] * m2[3];
            this.values[3] = m1[1] * m2[2] + m1[3] * m2[3];
            this.values[4] = m1[0] * m2[4] + m1[2] * m2[5] + m1[4];
            this.values[5] = m1[1] * m2[4] + m1[3] * m2[5] + m1[5];

            return this;
        },

        applyTo: function (ctx) {
            var m = this.values;
            ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        },

        equals: function (t) {
            if (t instanceof PTransform) {
                t = t.values;
            }

            for (var i = 0; i < 6; i += 1) {
                if (t[i] !== this.values[i]) {
                    return false;
                }
            }

            return true;
        },

        transform: function (target) {
            if (target instanceof PPoint) {
                var m = this.values;
                return new PPoint(target.x * m[0] + target.y * m[2] + m[4], target.x * m[1] + target.y * m[3] + m[5]);
            } else if (target instanceof PBounds) {
                var topLeft = new PPoint(target.x, target.y),
                    tPos = this.transform(topLeft),
                    bottomRight = new PPoint(target.x + target.width, target.y + target.height),
                    tBottomRight = this.transform(bottomRight);

                return new PBounds(
                    min(tPos.x, tBottomRight.x),
                    min(tPos.y, tBottomRight.y),
                    abs(tPos.x - tBottomRight.x),
                    abs(tPos.y - tBottomRight.y)
                    );
            } else if (target instanceof PTransform) {
                var transform = new PTransform(this.values);
                transform.transformBy(target);
                return transform;
            }

            throw "Invalid argument to transform method";
        },

        /** Returns the inverse matrix for this Transform */
        getInverse: function () {
            var m = this.values,
                det = m[0] * m[3] - m[1] * m[2],
                values = [];

            values[0] = m[3] / det;
            values[1] = -m[1] / det;
            values[2] = -m[2] / det;
            values[3] =  m[0] / det;
            values[4] = (m[2] * m[5] - m[3] * m[4]) / det;
            values[5] = -(m[0] * m[5] - m[1] * m[4]) / det;

            return new PTransform(values);
        },
        
        getScale: function() {
            var p = new PPoint(0,1);
            var tp = this.transform(p);
            tp.x -= this.values[4];
            tp.y -= this.values[5];          
            return Math.sqrt(tp.x * tp.x + tp.y * tp.y); 
        }
    });

    PTransform.lerp = function (t1, t2, zeroToOne) {
        var dest = [];

        for (var i = 0; i < 6 ; i += 1) {
            dest[i] = t1.values[i] + zeroToOne * (t2.values[i] - t1.values[i]);
        }

        return new PTransform(dest);
    };

    PPoint = Class.extend({
        init: function () {
            if (arguments.length === 0) {
                this.x = 0;
                this.y = 0;
            } else if (arguments.length === 1 && arguments[0] instanceof PPoint) {
                this.x = arguments[0].x;
                this.y = arguments[0].y;
            } else if (arguments.length === 2) {
                this.x = arguments[0];
                this.y = arguments[1];
            } else {
                throw "Illegal argument for PPoint constructor";
            }
        }
    });

    PBounds = Class.extend({
        init: function () {
            if (arguments.length === 1) {
                this.x = arguments[0].x;
                this.y = arguments[0].y;
                this.width = arguments[0].width;
                this.height = arguments[0].height;
                this.touched = true;
            } else {
                this.x = arguments[0] || 0;
                this.y = arguments[1] || 0;
                this.width = arguments[2] || 0;
                this.height = arguments[3] || 0;
                this.touched = arguments.length > 0;
            }
        },

        equals: function (bounds) {
            return bounds.x === this.x && bounds.y === this.y && bounds.width === this.width && bounds.height === this.height;
        },

        isEmpty: function () {
            return this.width === 0 && this.height === 0;
        },

        add: function () {
            var x, y, width, height;

            if (arguments.length === 1) {
                var src = arguments[0];
                x = src.x;
                y = src.y;
                width = src.width || 0;
                height = src.height || 0;
            } else {
                x = arguments[0];
                y = arguments[1];
                width = arguments[2] || 0;
                height = arguments[3] || 0;
            }

            if (this.touched) {
                var newX = min(x, this.x),
                    newY = min(y, this.y);

                var newBounds = {
                    x: newX,
                    y: newY,
                    width: max(this.x + this.width, x + width) - newX,
                    height: max(this.y + this.height, y + height) - newY
                };

                this.x = newBounds.x;
                this.y = newBounds.y;
                this.width = newBounds.width;
                this.height = newBounds.height;
            } else {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
            }

            this.touched = true;
        },

        contains: function () {
            var x, y;
            if (arguments.length === 1) {
                x = arguments[0].x;
                y = arguments[0].y;
            } else if (arguments.length === 2) {
                x = arguments[0];
                y = arguments[1];
            } else {
                throw "Invalid arguments";
            }

            return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height;
        },
        
        intersects: function(bounds) {
            return !(bounds.x + bounds.width < this.x
                || bounds.x > this.x + this.width 
                || bounds.y + bounds.height < this.y 
                || bounds.y > this.y + this.height); 
        }
    });

    PNode = Class.extend({
        init: function (params) {
            this.parent = null;
            this.children = [];
            this.listeners = [];
            this.fullBounds = null;
            this.globalFullBounds = null;
      
            this.transform = new PTransform();
            this.visible = true;

            if (params) {
                this.fillStyle = params.fillStyle || null;
                this.bounds = params.bounds || new PBounds();
            } else {
                this.bounds = new PBounds();
                this.fillStyle = null;
            }
        },

        invalidatePaint: function() {
            var root = this.getRoot();
            if (root) {
                root.invalidPaint = true;
            }
        },

        paint: function (ctx) {
            if (this.fillStyle && !this.bounds.isEmpty()) {
                ctx.fillStyle = this.fillStyle;
                ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
            }
        },

        paintAfterChildren: function (ctx) {
        },

        fullPaint: function (ctx) {    
            var inViewport = !ctx.clipBounds || ctx.clipBounds.intersects(this.getGlobalFullBounds());               
            if (this.visible && inViewport) {
              ctx.save();
  
              this.transform.applyTo(ctx);
  
              this.paint(ctx);
  
              for (var i = 0; i < this.children.length; i += 1) {
                  this.children[i].fullPaint(ctx);
              }
  
              this.paintAfterChildren(ctx);
  
              ctx.restore();
            }
        },

        scale: function (ratio) {
            this.transform.scale(ratio);
            this.invalidateBounds();
            this.invalidatePaint();

            return this;
        },

        translate: function (dx, dy) {
            this.transform.translate(dx, dy);
            this.invalidateBounds();
            this.invalidatePaint();

            return this;
        },

        rotate: function (theta) {
            this.transform.rotate(theta);
            this.invalidatePaint();

            return this;
        },

        addChild: function (child) {
            this.children.push(child);
            this.invalidateBounds();
            child.parent = this;
            this.invalidatePaint();

            return this;
        },

        removeChild: function (child) {
            child.parent = null;
            this.invalidateBounds();
            this.children = this.children.remove(child);
            this.invalidatePaint();

            return this;
        },

        setTransform: function (transform) {
            this.transform = transform;
            
            this.invalidateBounds();
            this.invalidatePaint();

            return this;
        },

        animateToTransform: function (transform, duration) {
            if (!duration) {
                this.transform = transform;
            } else {
                this.getRoot().scheduler.schedule(new PTransformActivity(this, transform, duration));
            }
        },

        getRoot: function () {
            return this.parent ? this.parent.getRoot() : null;
        },

        getFullBounds: function () {
            if (!this.fullBounds) {
                if (this.layoutChildren) {
                  this.layoutChildren(); 
                }
                
                this.fullBounds = new PBounds(this.bounds);

                var child, childFullBounds, tBounds;

                for (var i = 0, n = this.children.length; i < n; i += 1) {
                    child = this.children[i];
                    childFullBounds = child.getFullBounds();
                    tBounds = child.transform.transform(childFullBounds);

                    this.fullBounds.add(tBounds);
                }
            }

            return this.fullBounds;
        },

        getGlobalFullBounds: function () {
            if (!this.globalFullBounds) {
                var fullBounds = this.getFullBounds(),
                    currentNode = this,
                    tl = new PPoint(fullBounds.x, fullBounds.y),
                    br = new PPoint(fullBounds.x + fullBounds.width, fullBounds.y + fullBounds.height);                
    
                while (currentNode.parent) {
                    tl = currentNode.transform.transform(tl);
                    br = currentNode.transform.transform(br);
                    currentNode = currentNode.parent;
                }
    
                this.globalFullBounds = new PBounds(
                    min(tl.x, br.x),
                    min(tl.y, br.y),
                    abs(tl.x - br.x),
                    abs(tl.y - br.y)
                    );
            }
            
            return this.globalFullBounds;
        },

        getGlobalTransform: function () {
            var t = new PTransform(),
                currentNode = this;

            while (currentNode.parent) {
                t = currentNode.transform.transform(t);
                currentNode = currentNode.parent;
            }

            return t;
        },
        
        invalidateBounds: function() {
           this.fullBounds = null;
           this.globalFullBounds = null;
           
           if (this.parent) {
               this.parent.invalidateBounds(); 
           } 
        },

        localToParent: function (target) {
            return this.transform.transform(target);
        },

        parentToLocal: function (target) {
            return this.transform.getInverse().transform(target);
        },

        addListener: function (listener) {
            if (this.listeners.indexOf(listener) === -1) {
                this.listeners.push(listener);
            }
        },
        
        getScale: function() {
          return this.transform.getScale();
        }
    });

    PRoot = PNode.extend({
        init: function (args) {
            this._super(args);

            this.invalidPaint = true;

            this.scheduler = new PActivityScheduler(50);
        },

        getRoot: function () {
            return this;
        }
    });

    PText = PNode.extend({
        init: function (arg) {                     
            if (typeof arg === "string") {
                this._super();
                this.text = arg;
                this.recomputeBounds();
            } else if (arg) {
                this.text = arg.text;
                this._super(arg);
                this.recomputeBounds();
            } else {
                throw "Invalid argument for PText constructor";
            }
        },

        paint: function (ctx) {                   
            if (this.getGlobalFullBounds().height * ctx.displayScale  < 3) { 
                return;
            }
            
            if (this.fillStyle) {
                ctx.fillStyle = this.fillStyle;
            } else {
                ctx.fillStyle = "rgb(0,0,0)";
            }
            ctx.textBaseline = "top";
            ctx.fillText(this.text, this.bounds.x, this.bounds.y);
        },
        
        recomputeBounds: function() {
          var metric = PText.hiddenContext.measureText(this.text);
          this.bounds.width = metric.width;
          this.bounds.height = this.text ? PText.fontSize : 0; 
          this.invalidateBounds();
        }
    });
    PText.hiddenContext = document.createElement("canvas").getContext("2d");   
    PText.fontSize = 20;    
    
    
    PImage = PNode.extend({
        init: function (arg) {
            var _this = this;
            if (typeof arg === "string") {
                this.url = arg;
                this._super();
            } else {
                this.url = arg.url;
                this._super(arg);
            }

            this.loaded = false;

            this.image = new Image();
            this.image.onload = function () {                
                _this.bounds.width = this.width;
                _this.bounds.height = this.height;
                console.log(_this.bounds.width);                
                _this.loaded = true;
                _this.invalidateBounds();
                
                _this.invalidatePaint();
            };

            this.image.src = this.url;
        },

        paint: function (ctx) {
            if (this.loaded) {
                ctx.drawImage(this.image, 0, 0);
            }
        }
    });

    PLayer = PNode.extend({
        init: function (arg) {
            this._super(arg);

            this.cameras = [];
        },

        addCamera: function (camera) {
            if (this.cameras.indexOf(camera) === -1) {
                this.cameras.push(camera);
            }
        },

        removeCamera: function (camera) {
            camera.removeLayer(this);

            this.cameras = this.cameras.remove(camera);
        }
    });

    PCamera = PNode.extend({
        init: function () {
            this._super();
            this.layers = [];

            this.viewTransform = new PTransform();
        },

        paint: function (ctx) {
            this._super(ctx);

            ctx.save();

            this.viewTransform.applyTo(ctx);
            ctx.displayScale = this.viewTransform.getScale();
            
            var viewInverse = this.viewTransform.getInverse();
            ctx.clipBounds = viewInverse.transform(this.bounds);
            
            for (var i = 0; i < this.layers.length; i += 1) {
                this.layers[i].fullPaint(ctx);
            }

            ctx.restore();
        },

        addLayer: function (layer) {
            // bail if layer already added
            if (this.layers.indexOf(layer) === -1) {
                this.layers.push(layer);
                layer.addCamera(this);
            }

            this.invalidatePaint();
        },

        removeLayer: function (layer) {
            this.layers = this.layers.remove(layer);

            this.invalidatePaint();
        },

        getPickedNodes: function (x, y) {
            var viewInverse = this.viewTransform.getInverse(),
                mousePoint = new PPoint(x, y),
                globalPoint = viewInverse.transform(mousePoint),
                pickedNodes = [],
                layerPoint;
                
            for (var i = 0; i < this.layers.length; i += 1) {
                layerPoint = this.layers[i].transform.getInverse().transform(globalPoint);
                pickedNodes.pushAll(this._getPickedNodes(this.layers[i], layerPoint));
            }

            return pickedNodes;
        },

        _getPickedNodes: function (parent, parentPoint) {
            var pickedChildren = [],
                childBounds,
                childPoint;

            for (var i = 0; i < parent.children.length; i += 1) {
                childBounds = parent.children[i].getFullBounds();
                childPoint = parent.children[i].parentToLocal(parentPoint);
                if (childBounds.contains(childPoint)) {
                    pickedChildren.pushAll(this._getPickedNodes(parent.children[i], childPoint));
                }
            }

            return (pickedChildren.length === 0) ? [parent] : pickedChildren;
        },

        animateViewToTransform: function (transform, duration) {
            this.getRoot().scheduler.schedule(new PViewTransformActivity(this, transform, duration));
        },

        setViewTransform: function (transform) {
            this.viewTransform = transform;

            this.invalidatePaint();
        }
    });

    PCanvas = Class.extend({
        init: function (canvas, root) {
            if (typeof canvas === "string") {
                canvas = document.getElementById(canvas);
            }

            if (!canvas) {
                throw "Canvas provided to Piccolo is invalid!";
            }

            var _pCanvas = this;                                   
            
            this.canvas = canvas;
            canvas.font = PText.fontSize + "px Arial";

            this.root =  root || new PRoot();
            this.camera = new PCamera();
            this.camera.bounds = new PBounds(0, 0, canvas.width, canvas.height);

            var layer = new PLayer();
            this.root.addChild(layer);
            this.root.addChild(this.camera);
            this.camera.addLayer(layer);

            this.camera.getRoot().scheduler.schedule(new PActivity({
                step: function () {
                    _pCanvas.paint();
                }
            }));

            function dispatchEvent(type, event, pickedNodes) {
                var currentNode, listener;

                for (var nodeIndex  = 0; nodeIndex < pickedNodes.length; nodeIndex += 1) {
                    currentNode = pickedNodes[nodeIndex];
                    while (currentNode) {
                        for (var i = 0; i < currentNode.listeners.length; i += 1) {
                            listener = currentNode.listeners[i];
                            if (listener[type]) {
                                listener[type]({
                                    "event": event,
                                    "pickedNodes": pickedNodes
                                });
                            }
                        }
                        currentNode = currentNode.parent;
                    }
                }
            }

            var previousPickedNodes = [];

            function subtract(a, b) {
                var aminusb = [];

                for (var i = 0; i < a.length; i += 1) {
                    if (b.indexOf(a[i]) === -1) {
                        aminusb.push(a[i]);
                    }
                }

                return aminusb;
            }

            function processMouseOvers(oldNodes, newNodes, event) {
                var mouseOutNodes = subtract(oldNodes, newNodes),
                    mouseOverNodes = subtract(newNodes, oldNodes);

                dispatchEvent("mouseout", event, mouseOutNodes);
                dispatchEvent("mouseover", event, mouseOverNodes);
            }

            function processMouseEvent(name, event) {
                event.preventDefault();
                
                var offset = $(canvas).offset(),
                    x = event.pageX - offset.left,
                    y = event.pageY - offset.top,
                    newPickedNodes = _pCanvas.getPickedNodes(x, y);

                processMouseOvers(previousPickedNodes, newPickedNodes, event);

                dispatchEvent(name, event, newPickedNodes);
                previousPickedNodes = newPickedNodes;
            }

            //TODO: Remove jQuery dependence
            var $canvas = $(canvas);
            
            ["click", "mousemove", "mousedown", "mouseup"].forEach(function (name) {
                $canvas[name](function (event) {
                    processMouseEvent(name, event);
                });
            });

            $(canvas).mouseout(function (event) {
                dispatchEvent("mouseout", event, previousPickedNodes);
                previousPickedNodes = [];
            });
        },

        paint: function () {
            var root = this.camera.getRoot();
            if (root.invalidPaint) {              
                var ctx = this.canvas.getContext('2d');                               
                
                ctx.font = "16pt Helvetica";
                ctx.fillStyle = this.fillStyle || "rgb(255,255,255)";

                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

                this.camera.fullPaint(ctx);

                root.invalidPaint = false;
            }
        },

        getPickedNodes: function (x, y) {
            return this.camera.getPickedNodes(x, y);
        }
    });

    PActivity = Class.extend({
        init: function (options) {
            this.stepping = false;
            if (typeof options !== "undefined") {
                if (options.init) {
                    options.init.call(this);
                }
        
                if (options.started) {
                    this.started = options.started;
                }

                if (options.step) {
                    this.step = options.step;
                }

                if (options.finished) {
                    this.finished = options.finished;
                }
            }
        },

        started: function () {
        },

        step: function (ellapsedMillis) {
        },

        finished: function () {
        }
    });

    PInterpolatingActivity = PActivity.extend({
        init: function (options) {
            this.stepping = false;
            if (typeof options !== "undefined") {
                this._super(options);

                if (options.duration) {
                    this.duration = options.duration;
                }
            }
        },

        step: function (ellapsedMillis) {
            if (ellapsedMillis >= this.duration) {
                return false;
            }

            this.interpolate(ellapsedMillis / this.duration);

            return true;
        },

        interpolate: function (zeroToOne) {
        }

    });

    PActivityScheduler = Class.extend({
        init: function (frameRate) {
            this.pollingRate = frameRate;
            this.nextCallTime = 0;
            this.activities = [];
            this.intervalID = null;
            this.globalTime = new Date().getTime();
        },

        schedule: function (activity, startTime) {
            startTime = startTime || new Date().getTime();
            activity.startTime = startTime;
            this.activities.push(activity);
            this._start();
        },

        step: function () {
            var activity, keepers = [];

            this.globalTime = new Date().getTime();
            
            for (var i = 0; i < this.activities.length; i += 1) {
                activity = this.activities[i];

                if (activity.startTime > this.globalTime) {
                    keepers.push(activity);
                } else {
                    if (!activity.stepping) {
                        activity.stepping = true;
                        activity.started();
                    }

                    if (activity.step(this.globalTime - activity.startTime) !== false) {
                        keepers.push(activity);
                    } else {
                        activity.finished();
                    }
                }
            }

            this.activities = keepers;
      
            if (!this.activities) {
                this._stop();
            }
        },

        _start: function () {
            if (!this.intervalID) {
                var _this = this;
                this.intervalID = setInterval(function () {
                    _this.currentTime = new Date().getTime();
                    _this.step();
                }, this.pollingRate);
            }
        },

        _stop: function () {
            if (this.intervalID) {
                clearInterval(this.intervalID);
                this.intervalID = null;
            }
        }
    });

    PTransformActivity = PInterpolatingActivity.extend({
        init: function (node, targetTransform, duration) {
            this._super();
            this.duration = duration;
            this.node = node;
            this.source = node.transform;
            this.target = targetTransform;
        },

        interpolate: function (zeroToOne) {
            var dest = PTransform.lerp(this.source, this.target, zeroToOne);

            this.node.setTransform(dest);
        },

        finished: function () {
            this.node.setTransform(this.target);
        }
    });

    PViewTransformActivity = PInterpolatingActivity.extend({
        init: function (camera, targetTransform, duration) {
            this._super();
            this.duration = duration;
            this.camera = camera;
            this.source = camera.viewTransform;
            this.target = targetTransform;
        },

        interpolate: function (zeroToOne) {
            var dest = PTransform.lerp(this.source, this.target, zeroToOne);
            this.camera.setViewTransform(dest);
        },

        finished: function () {
            this.camera.setViewTransform(this.target);
        }
    });
})();