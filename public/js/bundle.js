(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./main')

},{"./main":3}],2:[function(require,module,exports){
var rAngle = 90 * (Math.PI / 180)
var sLine = 180 * (Math.PI / 180)

module.exports = {
   getRand: function (min, max) {
      return Math.random() * (max - min) + min;
   },
   getNewPoint: function (x, y, angle, distance) {
      return {
         x: +(Math.cos(angle) * distance + x).toFixed(2),
         y: +(Math.sin(angle) * distance + y).toFixed(2)
      }
   },
   rad2deg: function (rads) {
      return rads * (180 / Math.PI);
   },
   deg2rad: function (deg) {
      return deg * (Math.PI / 180)
   },
   rightAngle: function () {
      return rAngle
   },
   strLine: function () {
      return sLine
   },
   testCollision: function (r1, r2) {
      var combinedHalfWidths, combinedHalfHeights, vx, vy;

      r1.centerX = r1.position.x + r1.width / 2;
      r1.centerY = r1.position.y + r1.height / 2;
      r2.centerX = r2.position.x + r2.width / 2;
      r2.centerY = r2.position.y + r2.height / 2;

      r1.halfWidth = r1.width / 2;
      r1.halfHeight = r1.height / 2;
      r2.halfWidth = r2.width / 2;
      r2.halfHeight = r2.height / 2;

      vx = r1.centerX - r2.centerX;
      vy = r1.centerY - r2.centerY;

      combinedHalfWidths = r1.halfWidth + r2.halfWidth;
      combinedHalfHeights = r1.halfHeight + r2.halfHeight;

      return (Math.abs(vx) < combinedHalfWidths && Math.abs(vy) < combinedHalfHeights)
   },
   circleCollision: function(r1, r2) {
      var dx = r1.position.x - r2.position.x;
      var dy = r1.position.y - r2.position.y;
      var distance = Math.sqrt(dx * dx + dy * dy);

      return (distance < (r1.width / 2) + (r2.width / 2))
   }
}
},{}],3:[function(require,module,exports){
(function() {
   var h = require('./helper')
   var win = {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      mid: {
         x: document.documentElement.clientWidth / 2,
         y: document.documentElement.clientHeight / 2
      }
   }
   var offset = { x: 0, y: 0 }
   var renderer = PIXI.autoDetectRenderer(win.width, win.height, { backgroundColor: 0x98a3d7 })
   var stage = new PIXI.Container()
   var textureFace = PIXI.Texture.fromImage('images/batworm.png')
   var textureBody = PIXI.Texture.fromImage('images/batbody.png')
   var textureFood = PIXI.Texture.fromImage('images/circle2.png')
   var bg = new PIXI.Sprite(PIXI.Texture.fromImage('images/lego.jpg'))
   var score = 0
   var squirmSize = 10
   var scoreStyle = { fontFamily: "Arial", fontSize: 18, fill: "white", stroke: "black", strokeThickness: 4 }
   var scoreText = new PIXI.Text("Score: " + score + "\nSize: " + squirmSize, scoreStyle)
   var debugStyle = { fontFamily: "Arial", fontSize: 18, fill: "white", stroke: "black", strokeThickness: 4 }
   var debugText = new PIXI.Text("oldrads: " + 0 + "\nnewrads: " + 0, debugStyle)
   var me = []
   var coords = []
   var food = []
   var mouse = renderer.plugins.interaction.mouse.global
   var baseSpeed = 3
   var overdrive = 1

   stage.updateLayersOrder = function () {
      stage.children.sort(function (a, b) {
         a.zIndex = a.zIndex || 0
         b.zIndex = b.zIndex || 0
         return a.zIndex - b.zIndex
      })
   }

   function init () {
      document.body.appendChild(renderer.view)
      window.onresize = resize
      setBackground()
      setScore()
      setDebug()
      buildSquirmer(squirmSize)
      looper()
   }

   function setBackground () {
      bg.position.x = 0
      bg.position.y = 0
      bg.anchor.x = .5
      bg.anchor.y = .5
      bg.zIndex = 1
      bg.interactive = true
      bg.on('mousedown', function () {
         overdrive = 2
      })
      bg.on('mouseup', function () {
         overdrive = 1
      })
      stage.addChild(bg)
   }

   function setScore () {
      scoreText.position.x = 0
      scoreText.position.y = win.height
      scoreText.anchor.x = 0
      scoreText.anchor.y = 1
      scoreText.zIndex = 10000
      stage.addChild(scoreText);
   }
   function setDebug () {
      debugText.position.x = win.width
      debugText.position.y = win.height
      debugText.anchor.x = 1
      debugText.anchor.y = 1
      debugText.zIndex = 10000
      stage.addChild(debugText);
   }

   function updateDebugText(o,n) {
      debugText.text = "oldrads: " + o.toFixed(2) + "\nnewrads: " + n.toFixed(2)

   }

   function sameQuadNav(oldr,newr) {

   }

   function selfMovement () {
      var speed = baseSpeed * overdrive
      var distance = {
         total: 0,
         x: 0,
         y: 0
      }
      distance.x = mouse.x - win.mid.x
      distance.y = mouse.y - win.mid.y
      var oldrads = +me[0].rotation.toFixed(2)
      var newrads = Math.atan2(distance.y, distance.x)
      var angleDif = Math.abs(Math.abs(oldrads) - Math.abs(newrads))

      updateDebugText(oldrads,newrads)

      if ((oldrads < 0 && Math.abs(oldrads) > h.rightAngle()) && (newrads < 0 && Math.abs(newrads) > h.rightAngle())) {
 //        console.log("SAME QUAD NAV UPPER LEFT")
 //        if (oldrads < newrads) console.log("HEADED RIGHT")
 //        if (oldrads > newrads) console.log("HEADED LEFT")
         sameQuadNav(oldrads,newrads)
      }
      if ((oldrads < 0 && Math.abs(oldrads) < h.rightAngle()) && (newrads < 0 && Math.abs(newrads) < h.rightAngle())) {
//         console.log("SAME QUAD NAV UPPER RIGHT")
//         if (oldrads < newrads) console.log("HEADED RIGHT")
//         if (oldrads > newrads) console.log("HEADED LEFT")
         sameQuadNav(oldrads,newrads)
      }
      if ((oldrads > 0 && Math.abs(oldrads) > h.rightAngle()) && (newrads > 0 && Math.abs(newrads) > h.rightAngle())) {
//         console.log("SAME QUAD NAV LOWER LEFT")
//         if (oldrads < newrads) console.log("HEADED LEFT")
//         if (oldrads > newrads) console.log("HEADED RIGHT")
         sameQuadNav(oldrads,newrads)
      }
      if ((oldrads > 0 && Math.abs(oldrads) < h.rightAngle()) && (newrads > 0 && Math.abs(newrads) < h.rightAngle())) {
//         console.log("SAME QUAD NAV LOWER RIGHT")
//         if (oldrads < newrads) console.log("HEADED LEFT")
//         if (oldrads > newrads) console.log("HEADED RIGHT")
         sameQuadNav(oldrads,newrads)
      }

      if ((oldrads < 0 && Math.abs(oldrads) > h.rightAngle()) && (newrads < 0 && Math.abs(newrads) < h.rightAngle())) {
 //        console.log("UPPER LEFT => UPPER RIGHT")
         sameQuadNav(oldrads,newrads)
      }
      if ((oldrads < 0 && Math.abs(oldrads) < h.rightAngle()) && (newrads < 0 && Math.abs(newrads) > h.rightAngle())) {
//         console.log("UPPER RIGHT => UPPER LEFT")
         sameQuadNav(oldrads,newrads)
      }
      if ((oldrads > 0 && Math.abs(oldrads) > h.rightAngle()) && (newrads > 0 && Math.abs(newrads) < h.rightAngle())) {
//         console.log("LOWER LEFT => LOWER RIGHT")
         sameQuadNav(oldrads,newrads)
      }
      if ((oldrads > 0 && Math.abs(oldrads) < h.rightAngle()) && (newrads > 0 && Math.abs(newrads) > h.rightAngle())) {
//         console.log("LOWER RIGHT => LOWER LEFT")
         sameQuadNav(oldrads,newrads)
      }

      if ((oldrads < 0 && Math.abs(oldrads) > h.rightAngle()) && (newrads > 0 && Math.abs(newrads) > h.rightAngle())) {
//         console.log("UPPER LEFT => LOWER LEFT")
         sameQuadNav(oldrads,newrads)
      }
      if ((oldrads < 0 && Math.abs(oldrads) < h.rightAngle()) && (newrads > 0 && Math.abs(newrads) < h.rightAngle())) {
//         console.log("UPPER RIGHT => LOWER RIGHT")
         sameQuadNav(oldrads,newrads)
      }
      if ((oldrads > 0 && Math.abs(oldrads) > h.rightAngle()) && (newrads < 0 && Math.abs(newrads) > h.rightAngle())) {
//         console.log("LOWER LEFT => UPPER LEFT")
         sameQuadNav(oldrads,newrads)
      }
      if ((oldrads > 0 && Math.abs(oldrads) < h.rightAngle()) && (newrads < 0 && Math.abs(newrads) < h.rightAngle())) {
//         console.log("LOWER RIGHT => UPPER RIGHT")
         sameQuadNav(oldrads,newrads)
      }

      me[0].rotation = newrads
      me[0].vx = Math.cos(me[0].rotation) * speed
      me[0].vy = Math.sin(me[0].rotation) * speed

      moveBg(me[0].vx, me[0].vy)
      moveFood(me[0].vx, me[0].vy)

      coords[0].x += me[0].vx
      coords[0].y += me[0].vy
      offset.x += me[0].vx
      offset.y += me[0].vy

      for (var i = 1; i < me.length; i++) {
         distance.x = coords[i - 1].x - coords[i].x
         distance.y = coords[i - 1].y - coords[i].y
         distance.total = Math.hypot(coords[i - 1].x - coords[i].x, coords[i - 1].y - coords[i].y)
         me[i].rotation = Math.atan2(distance.y, distance.x)
         me[i].vx = Math.cos(me[i].rotation) * speed
         me[i].vy = Math.sin(me[i].rotation) * speed

         var newCoords = {
            x: coords[i].x + me[i].vx - offset.x,
            y: coords[i].y + me[i].vy - offset.y
         }

         if (distance.total < 5 + speed) {
            newCoords = h.getNewPoint(newCoords.x, newCoords.y, me[i].rotation, -speed)
         }

         coords[i].x = offset.x + newCoords.x
         coords[i].y = offset.y + newCoords.y
         me[i].position.x = newCoords.x
         me[i].position.y = newCoords.y

      }
   }

   function checkFoodCollisions () {
      if (food.length > 0) {
         food.forEach(function (item) {
            if (h.circleCollision(me[0], item))
               eatFood(item)
         })
      }
   }

   function updateScoreText(sc,si) {
      scoreText.text = "Score: " + Math.round(sc) + "\nSize: " + si
   }

   function eatFood (f) {
      var index = food.indexOf(f)
      stage.removeChild(f)
      score += (10 * f.scale.x)
      updateScoreText(score,squirmSize)
      food.splice(index, 1)
      checkGrowth()
   }

   function checkGrowth () {
      var newSize = Math.round(score / 10) + 10

      if (newSize > squirmSize) {
         var diff = newSize - squirmSize
         for (var i = 0; i < diff; i++) {
            var newSeg = new PIXI.Sprite(textureBody)
            var last = me.length - 1
            newSeg.anchor.x = .5
            newSeg.anchor.y = .5
            newSeg.position.x = me[last].position.x
            newSeg.position.y = me[last].position.y
            newSeg.scale.x = .4
            newSeg.scale.y = .4
            newSeg.zIndex = newSize + 11
            stage.addChild(newSeg)
            me.push(newSeg)
            coords.push({ x: coords[last].x, y: coords[last].y })
         }
         for (i = 0; i < me.length; i++) {
            me[i].zIndex = newSize - i + 10
         }
         squirmSize = newSize
      }

   }

   function moveBg (x, y) {
      bg.position.x -= x
      bg.position.y -= y
   }

   function moveFood (x, y) {
      food.forEach(function (item) {
         item.position.x -= x
         item.position.y -= y
      })
   }

   function buildSquirmer (size) {
      size = size < 1 ? 1 : size

      // zindex for face is (size + 11)
      // zindex for body is 10 to (size + 10)
      // zindex for scoreText is 6
      // zindex for food is 5
      // zidnex for bg is 1
      var zi = size + 10

      var face = new PIXI.Sprite(textureFace)
      face.position.x = win.width / 2
      face.position.y = win.height / 2
      face.anchor.x = .5
      face.anchor.y = .5
      face.scale.x = .4
      face.scale.y = .4
      face.zIndex = zi + 1

      var body = []
      for (var i = 0; i < size; i++) {
         body[i] = new PIXI.Sprite(textureBody)
         body[i].anchor.x = .5
         body[i].anchor.y = .5
         body[i].position.x = face.position.x
         body[i].position.y = face.position.y
         body[i].scale.x = .4
         body[i].scale.y = .4
         body[i].zIndex = zi - i
      }

      me[0] = face

      body.forEach(function (item) {
         me.push(item)
      })

      var adder = [].concat(me).reverse()
      adder.forEach(function (item) {
         stage.addChild(item)
      })

      for (var i = 0; i < me.length; i++) {
         coords[i] = { x: me[i].position.x, y: me[i].position.y }
      }
   }

   function makeFood () {
      if (h.getRand(1, 100) > 98) {
         var fScale = h.getRand(.2, .7)
         var newFood = new PIXI.Sprite(textureFood)
         newFood.anchor.x = .5
         newFood.anchor.y = .5
         newFood.position.x = h.getRand(0, win.width)
         newFood.position.y = h.getRand(0, win.height)
         newFood.scale.x = fScale
         newFood.scale.y = fScale
         newFood.zIndex = 5

         food.push(newFood)
         stage.addChild(newFood)
      }
   }


   function looper () {
      requestAnimationFrame(looper)
      selfMovement()
      checkFoodCollisions()
      makeFood()
      stage.updateLayersOrder()
      renderer.render(stage)
   }

   function resize () {
      if (win.width != document.documentElement.clientWidth || win.height != document.documentElement.clientHeight) {
         win = {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
            mid: {
               x: document.documentElement.clientWidth / 2,
               y: document.documentElement.clientHeight / 2
            }
         }
      }
      renderer.resize(win.width, win.height)
   }

   init()
})()
},{"./helper":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyL2NvcmUuanMiLCJicm93c2VyL2hlbHBlci5qcyIsImJyb3dzZXIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJyZXF1aXJlKCcuL21haW4nKVxuIiwidmFyIHJBbmdsZSA9IDkwICogKE1hdGguUEkgLyAxODApXG52YXIgc0xpbmUgPSAxODAgKiAoTWF0aC5QSSAvIDE4MClcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICBnZXRSYW5kOiBmdW5jdGlvbiAobWluLCBtYXgpIHtcbiAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyBtaW47XG4gICB9LFxuICAgZ2V0TmV3UG9pbnQ6IGZ1bmN0aW9uICh4LCB5LCBhbmdsZSwgZGlzdGFuY2UpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgICB4OiArKE1hdGguY29zKGFuZ2xlKSAqIGRpc3RhbmNlICsgeCkudG9GaXhlZCgyKSxcbiAgICAgICAgIHk6ICsoTWF0aC5zaW4oYW5nbGUpICogZGlzdGFuY2UgKyB5KS50b0ZpeGVkKDIpXG4gICAgICB9XG4gICB9LFxuICAgcmFkMmRlZzogZnVuY3Rpb24gKHJhZHMpIHtcbiAgICAgIHJldHVybiByYWRzICogKDE4MCAvIE1hdGguUEkpO1xuICAgfSxcbiAgIGRlZzJyYWQ6IGZ1bmN0aW9uIChkZWcpIHtcbiAgICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MClcbiAgIH0sXG4gICByaWdodEFuZ2xlOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gckFuZ2xlXG4gICB9LFxuICAgc3RyTGluZTogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHNMaW5lXG4gICB9LFxuICAgdGVzdENvbGxpc2lvbjogZnVuY3Rpb24gKHIxLCByMikge1xuICAgICAgdmFyIGNvbWJpbmVkSGFsZldpZHRocywgY29tYmluZWRIYWxmSGVpZ2h0cywgdngsIHZ5O1xuXG4gICAgICByMS5jZW50ZXJYID0gcjEucG9zaXRpb24ueCArIHIxLndpZHRoIC8gMjtcbiAgICAgIHIxLmNlbnRlclkgPSByMS5wb3NpdGlvbi55ICsgcjEuaGVpZ2h0IC8gMjtcbiAgICAgIHIyLmNlbnRlclggPSByMi5wb3NpdGlvbi54ICsgcjIud2lkdGggLyAyO1xuICAgICAgcjIuY2VudGVyWSA9IHIyLnBvc2l0aW9uLnkgKyByMi5oZWlnaHQgLyAyO1xuXG4gICAgICByMS5oYWxmV2lkdGggPSByMS53aWR0aCAvIDI7XG4gICAgICByMS5oYWxmSGVpZ2h0ID0gcjEuaGVpZ2h0IC8gMjtcbiAgICAgIHIyLmhhbGZXaWR0aCA9IHIyLndpZHRoIC8gMjtcbiAgICAgIHIyLmhhbGZIZWlnaHQgPSByMi5oZWlnaHQgLyAyO1xuXG4gICAgICB2eCA9IHIxLmNlbnRlclggLSByMi5jZW50ZXJYO1xuICAgICAgdnkgPSByMS5jZW50ZXJZIC0gcjIuY2VudGVyWTtcblxuICAgICAgY29tYmluZWRIYWxmV2lkdGhzID0gcjEuaGFsZldpZHRoICsgcjIuaGFsZldpZHRoO1xuICAgICAgY29tYmluZWRIYWxmSGVpZ2h0cyA9IHIxLmhhbGZIZWlnaHQgKyByMi5oYWxmSGVpZ2h0O1xuXG4gICAgICByZXR1cm4gKE1hdGguYWJzKHZ4KSA8IGNvbWJpbmVkSGFsZldpZHRocyAmJiBNYXRoLmFicyh2eSkgPCBjb21iaW5lZEhhbGZIZWlnaHRzKVxuICAgfSxcbiAgIGNpcmNsZUNvbGxpc2lvbjogZnVuY3Rpb24ocjEsIHIyKSB7XG4gICAgICB2YXIgZHggPSByMS5wb3NpdGlvbi54IC0gcjIucG9zaXRpb24ueDtcbiAgICAgIHZhciBkeSA9IHIxLnBvc2l0aW9uLnkgLSByMi5wb3NpdGlvbi55O1xuICAgICAgdmFyIGRpc3RhbmNlID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcblxuICAgICAgcmV0dXJuIChkaXN0YW5jZSA8IChyMS53aWR0aCAvIDIpICsgKHIyLndpZHRoIC8gMikpXG4gICB9XG59IiwiKGZ1bmN0aW9uKCkge1xuICAgdmFyIGggPSByZXF1aXJlKCcuL2hlbHBlcicpXG4gICB2YXIgd2luID0ge1xuICAgICAgd2lkdGg6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCxcbiAgICAgIGhlaWdodDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCxcbiAgICAgIG1pZDoge1xuICAgICAgICAgeDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIC8gMixcbiAgICAgICAgIHk6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgLyAyXG4gICAgICB9XG4gICB9XG4gICB2YXIgb2Zmc2V0ID0geyB4OiAwLCB5OiAwIH1cbiAgIHZhciByZW5kZXJlciA9IFBJWEkuYXV0b0RldGVjdFJlbmRlcmVyKHdpbi53aWR0aCwgd2luLmhlaWdodCwgeyBiYWNrZ3JvdW5kQ29sb3I6IDB4OThhM2Q3IH0pXG4gICB2YXIgc3RhZ2UgPSBuZXcgUElYSS5Db250YWluZXIoKVxuICAgdmFyIHRleHR1cmVGYWNlID0gUElYSS5UZXh0dXJlLmZyb21JbWFnZSgnaW1hZ2VzL2JhdHdvcm0ucG5nJylcbiAgIHZhciB0ZXh0dXJlQm9keSA9IFBJWEkuVGV4dHVyZS5mcm9tSW1hZ2UoJ2ltYWdlcy9iYXRib2R5LnBuZycpXG4gICB2YXIgdGV4dHVyZUZvb2QgPSBQSVhJLlRleHR1cmUuZnJvbUltYWdlKCdpbWFnZXMvY2lyY2xlMi5wbmcnKVxuICAgdmFyIGJnID0gbmV3IFBJWEkuU3ByaXRlKFBJWEkuVGV4dHVyZS5mcm9tSW1hZ2UoJ2ltYWdlcy9sZWdvLmpwZycpKVxuICAgdmFyIHNjb3JlID0gMFxuICAgdmFyIHNxdWlybVNpemUgPSAxMFxuICAgdmFyIHNjb3JlU3R5bGUgPSB7IGZvbnRGYW1pbHk6IFwiQXJpYWxcIiwgZm9udFNpemU6IDE4LCBmaWxsOiBcIndoaXRlXCIsIHN0cm9rZTogXCJibGFja1wiLCBzdHJva2VUaGlja25lc3M6IDQgfVxuICAgdmFyIHNjb3JlVGV4dCA9IG5ldyBQSVhJLlRleHQoXCJTY29yZTogXCIgKyBzY29yZSArIFwiXFxuU2l6ZTogXCIgKyBzcXVpcm1TaXplLCBzY29yZVN0eWxlKVxuICAgdmFyIGRlYnVnU3R5bGUgPSB7IGZvbnRGYW1pbHk6IFwiQXJpYWxcIiwgZm9udFNpemU6IDE4LCBmaWxsOiBcIndoaXRlXCIsIHN0cm9rZTogXCJibGFja1wiLCBzdHJva2VUaGlja25lc3M6IDQgfVxuICAgdmFyIGRlYnVnVGV4dCA9IG5ldyBQSVhJLlRleHQoXCJvbGRyYWRzOiBcIiArIDAgKyBcIlxcbm5ld3JhZHM6IFwiICsgMCwgZGVidWdTdHlsZSlcbiAgIHZhciBtZSA9IFtdXG4gICB2YXIgY29vcmRzID0gW11cbiAgIHZhciBmb29kID0gW11cbiAgIHZhciBtb3VzZSA9IHJlbmRlcmVyLnBsdWdpbnMuaW50ZXJhY3Rpb24ubW91c2UuZ2xvYmFsXG4gICB2YXIgYmFzZVNwZWVkID0gM1xuICAgdmFyIG92ZXJkcml2ZSA9IDFcblxuICAgc3RhZ2UudXBkYXRlTGF5ZXJzT3JkZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBzdGFnZS5jaGlsZHJlbi5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICBhLnpJbmRleCA9IGEuekluZGV4IHx8IDBcbiAgICAgICAgIGIuekluZGV4ID0gYi56SW5kZXggfHwgMFxuICAgICAgICAgcmV0dXJuIGEuekluZGV4IC0gYi56SW5kZXhcbiAgICAgIH0pXG4gICB9XG5cbiAgIGZ1bmN0aW9uIGluaXQgKCkge1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyZW5kZXJlci52aWV3KVxuICAgICAgd2luZG93Lm9ucmVzaXplID0gcmVzaXplXG4gICAgICBzZXRCYWNrZ3JvdW5kKClcbiAgICAgIHNldFNjb3JlKClcbiAgICAgIHNldERlYnVnKClcbiAgICAgIGJ1aWxkU3F1aXJtZXIoc3F1aXJtU2l6ZSlcbiAgICAgIGxvb3BlcigpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIHNldEJhY2tncm91bmQgKCkge1xuICAgICAgYmcucG9zaXRpb24ueCA9IDBcbiAgICAgIGJnLnBvc2l0aW9uLnkgPSAwXG4gICAgICBiZy5hbmNob3IueCA9IC41XG4gICAgICBiZy5hbmNob3IueSA9IC41XG4gICAgICBiZy56SW5kZXggPSAxXG4gICAgICBiZy5pbnRlcmFjdGl2ZSA9IHRydWVcbiAgICAgIGJnLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICBvdmVyZHJpdmUgPSAyXG4gICAgICB9KVxuICAgICAgYmcub24oJ21vdXNldXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICBvdmVyZHJpdmUgPSAxXG4gICAgICB9KVxuICAgICAgc3RhZ2UuYWRkQ2hpbGQoYmcpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIHNldFNjb3JlICgpIHtcbiAgICAgIHNjb3JlVGV4dC5wb3NpdGlvbi54ID0gMFxuICAgICAgc2NvcmVUZXh0LnBvc2l0aW9uLnkgPSB3aW4uaGVpZ2h0XG4gICAgICBzY29yZVRleHQuYW5jaG9yLnggPSAwXG4gICAgICBzY29yZVRleHQuYW5jaG9yLnkgPSAxXG4gICAgICBzY29yZVRleHQuekluZGV4ID0gMTAwMDBcbiAgICAgIHN0YWdlLmFkZENoaWxkKHNjb3JlVGV4dCk7XG4gICB9XG4gICBmdW5jdGlvbiBzZXREZWJ1ZyAoKSB7XG4gICAgICBkZWJ1Z1RleHQucG9zaXRpb24ueCA9IHdpbi53aWR0aFxuICAgICAgZGVidWdUZXh0LnBvc2l0aW9uLnkgPSB3aW4uaGVpZ2h0XG4gICAgICBkZWJ1Z1RleHQuYW5jaG9yLnggPSAxXG4gICAgICBkZWJ1Z1RleHQuYW5jaG9yLnkgPSAxXG4gICAgICBkZWJ1Z1RleHQuekluZGV4ID0gMTAwMDBcbiAgICAgIHN0YWdlLmFkZENoaWxkKGRlYnVnVGV4dCk7XG4gICB9XG5cbiAgIGZ1bmN0aW9uIHVwZGF0ZURlYnVnVGV4dChvLG4pIHtcbiAgICAgIGRlYnVnVGV4dC50ZXh0ID0gXCJvbGRyYWRzOiBcIiArIG8udG9GaXhlZCgyKSArIFwiXFxubmV3cmFkczogXCIgKyBuLnRvRml4ZWQoMilcblxuICAgfVxuXG4gICBmdW5jdGlvbiBzYW1lUXVhZE5hdihvbGRyLG5ld3IpIHtcblxuICAgfVxuXG4gICBmdW5jdGlvbiBzZWxmTW92ZW1lbnQgKCkge1xuICAgICAgdmFyIHNwZWVkID0gYmFzZVNwZWVkICogb3ZlcmRyaXZlXG4gICAgICB2YXIgZGlzdGFuY2UgPSB7XG4gICAgICAgICB0b3RhbDogMCxcbiAgICAgICAgIHg6IDAsXG4gICAgICAgICB5OiAwXG4gICAgICB9XG4gICAgICBkaXN0YW5jZS54ID0gbW91c2UueCAtIHdpbi5taWQueFxuICAgICAgZGlzdGFuY2UueSA9IG1vdXNlLnkgLSB3aW4ubWlkLnlcbiAgICAgIHZhciBvbGRyYWRzID0gK21lWzBdLnJvdGF0aW9uLnRvRml4ZWQoMilcbiAgICAgIHZhciBuZXdyYWRzID0gTWF0aC5hdGFuMihkaXN0YW5jZS55LCBkaXN0YW5jZS54KVxuICAgICAgdmFyIGFuZ2xlRGlmID0gTWF0aC5hYnMoTWF0aC5hYnMob2xkcmFkcykgLSBNYXRoLmFicyhuZXdyYWRzKSlcblxuICAgICAgdXBkYXRlRGVidWdUZXh0KG9sZHJhZHMsbmV3cmFkcylcblxuICAgICAgaWYgKChvbGRyYWRzIDwgMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA8IDAgJiYgTWF0aC5hYnMobmV3cmFkcykgPiBoLnJpZ2h0QW5nbGUoKSkpIHtcbiAvLyAgICAgICAgY29uc29sZS5sb2coXCJTQU1FIFFVQUQgTkFWIFVQUEVSIExFRlRcIilcbiAvLyAgICAgICAgaWYgKG9sZHJhZHMgPCBuZXdyYWRzKSBjb25zb2xlLmxvZyhcIkhFQURFRCBSSUdIVFwiKVxuIC8vICAgICAgICBpZiAob2xkcmFkcyA+IG5ld3JhZHMpIGNvbnNvbGUubG9nKFwiSEVBREVEIExFRlRcIilcbiAgICAgICAgIHNhbWVRdWFkTmF2KG9sZHJhZHMsbmV3cmFkcylcbiAgICAgIH1cbiAgICAgIGlmICgob2xkcmFkcyA8IDAgJiYgTWF0aC5hYnMob2xkcmFkcykgPCBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPCAwICYmIE1hdGguYWJzKG5ld3JhZHMpIDwgaC5yaWdodEFuZ2xlKCkpKSB7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKFwiU0FNRSBRVUFEIE5BViBVUFBFUiBSSUdIVFwiKVxuLy8gICAgICAgICBpZiAob2xkcmFkcyA8IG5ld3JhZHMpIGNvbnNvbGUubG9nKFwiSEVBREVEIFJJR0hUXCIpXG4vLyAgICAgICAgIGlmIChvbGRyYWRzID4gbmV3cmFkcykgY29uc29sZS5sb2coXCJIRUFERUQgTEVGVFwiKVxuICAgICAgICAgc2FtZVF1YWROYXYob2xkcmFkcyxuZXdyYWRzKVxuICAgICAgfVxuICAgICAgaWYgKChvbGRyYWRzID4gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA+IDAgJiYgTWF0aC5hYnMobmV3cmFkcykgPiBoLnJpZ2h0QW5nbGUoKSkpIHtcbi8vICAgICAgICAgY29uc29sZS5sb2coXCJTQU1FIFFVQUQgTkFWIExPV0VSIExFRlRcIilcbi8vICAgICAgICAgaWYgKG9sZHJhZHMgPCBuZXdyYWRzKSBjb25zb2xlLmxvZyhcIkhFQURFRCBMRUZUXCIpXG4vLyAgICAgICAgIGlmIChvbGRyYWRzID4gbmV3cmFkcykgY29uc29sZS5sb2coXCJIRUFERUQgUklHSFRcIilcbiAgICAgICAgIHNhbWVRdWFkTmF2KG9sZHJhZHMsbmV3cmFkcylcbiAgICAgIH1cbiAgICAgIGlmICgob2xkcmFkcyA+IDAgJiYgTWF0aC5hYnMob2xkcmFkcykgPCBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPiAwICYmIE1hdGguYWJzKG5ld3JhZHMpIDwgaC5yaWdodEFuZ2xlKCkpKSB7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKFwiU0FNRSBRVUFEIE5BViBMT1dFUiBSSUdIVFwiKVxuLy8gICAgICAgICBpZiAob2xkcmFkcyA8IG5ld3JhZHMpIGNvbnNvbGUubG9nKFwiSEVBREVEIExFRlRcIilcbi8vICAgICAgICAgaWYgKG9sZHJhZHMgPiBuZXdyYWRzKSBjb25zb2xlLmxvZyhcIkhFQURFRCBSSUdIVFwiKVxuICAgICAgICAgc2FtZVF1YWROYXYob2xkcmFkcyxuZXdyYWRzKVxuICAgICAgfVxuXG4gICAgICBpZiAoKG9sZHJhZHMgPCAwICYmIE1hdGguYWJzKG9sZHJhZHMpID4gaC5yaWdodEFuZ2xlKCkpICYmIChuZXdyYWRzIDwgMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA8IGgucmlnaHRBbmdsZSgpKSkge1xuIC8vICAgICAgICBjb25zb2xlLmxvZyhcIlVQUEVSIExFRlQgPT4gVVBQRVIgUklHSFRcIilcbiAgICAgICAgIHNhbWVRdWFkTmF2KG9sZHJhZHMsbmV3cmFkcylcbiAgICAgIH1cbiAgICAgIGlmICgob2xkcmFkcyA8IDAgJiYgTWF0aC5hYnMob2xkcmFkcykgPCBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPCAwICYmIE1hdGguYWJzKG5ld3JhZHMpID4gaC5yaWdodEFuZ2xlKCkpKSB7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKFwiVVBQRVIgUklHSFQgPT4gVVBQRVIgTEVGVFwiKVxuICAgICAgICAgc2FtZVF1YWROYXYob2xkcmFkcyxuZXdyYWRzKVxuICAgICAgfVxuICAgICAgaWYgKChvbGRyYWRzID4gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA+IDAgJiYgTWF0aC5hYnMobmV3cmFkcykgPCBoLnJpZ2h0QW5nbGUoKSkpIHtcbi8vICAgICAgICAgY29uc29sZS5sb2coXCJMT1dFUiBMRUZUID0+IExPV0VSIFJJR0hUXCIpXG4gICAgICAgICBzYW1lUXVhZE5hdihvbGRyYWRzLG5ld3JhZHMpXG4gICAgICB9XG4gICAgICBpZiAoKG9sZHJhZHMgPiAwICYmIE1hdGguYWJzKG9sZHJhZHMpIDwgaC5yaWdodEFuZ2xlKCkpICYmIChuZXdyYWRzID4gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA+IGgucmlnaHRBbmdsZSgpKSkge1xuLy8gICAgICAgICBjb25zb2xlLmxvZyhcIkxPV0VSIFJJR0hUID0+IExPV0VSIExFRlRcIilcbiAgICAgICAgIHNhbWVRdWFkTmF2KG9sZHJhZHMsbmV3cmFkcylcbiAgICAgIH1cblxuICAgICAgaWYgKChvbGRyYWRzIDwgMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA+IDAgJiYgTWF0aC5hYnMobmV3cmFkcykgPiBoLnJpZ2h0QW5nbGUoKSkpIHtcbi8vICAgICAgICAgY29uc29sZS5sb2coXCJVUFBFUiBMRUZUID0+IExPV0VSIExFRlRcIilcbiAgICAgICAgIHNhbWVRdWFkTmF2KG9sZHJhZHMsbmV3cmFkcylcbiAgICAgIH1cbiAgICAgIGlmICgob2xkcmFkcyA8IDAgJiYgTWF0aC5hYnMob2xkcmFkcykgPCBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPiAwICYmIE1hdGguYWJzKG5ld3JhZHMpIDwgaC5yaWdodEFuZ2xlKCkpKSB7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKFwiVVBQRVIgUklHSFQgPT4gTE9XRVIgUklHSFRcIilcbiAgICAgICAgIHNhbWVRdWFkTmF2KG9sZHJhZHMsbmV3cmFkcylcbiAgICAgIH1cbiAgICAgIGlmICgob2xkcmFkcyA+IDAgJiYgTWF0aC5hYnMob2xkcmFkcykgPiBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPCAwICYmIE1hdGguYWJzKG5ld3JhZHMpID4gaC5yaWdodEFuZ2xlKCkpKSB7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKFwiTE9XRVIgTEVGVCA9PiBVUFBFUiBMRUZUXCIpXG4gICAgICAgICBzYW1lUXVhZE5hdihvbGRyYWRzLG5ld3JhZHMpXG4gICAgICB9XG4gICAgICBpZiAoKG9sZHJhZHMgPiAwICYmIE1hdGguYWJzKG9sZHJhZHMpIDwgaC5yaWdodEFuZ2xlKCkpICYmIChuZXdyYWRzIDwgMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA8IGgucmlnaHRBbmdsZSgpKSkge1xuLy8gICAgICAgICBjb25zb2xlLmxvZyhcIkxPV0VSIFJJR0hUID0+IFVQUEVSIFJJR0hUXCIpXG4gICAgICAgICBzYW1lUXVhZE5hdihvbGRyYWRzLG5ld3JhZHMpXG4gICAgICB9XG5cbiAgICAgIG1lWzBdLnJvdGF0aW9uID0gbmV3cmFkc1xuICAgICAgbWVbMF0udnggPSBNYXRoLmNvcyhtZVswXS5yb3RhdGlvbikgKiBzcGVlZFxuICAgICAgbWVbMF0udnkgPSBNYXRoLnNpbihtZVswXS5yb3RhdGlvbikgKiBzcGVlZFxuXG4gICAgICBtb3ZlQmcobWVbMF0udngsIG1lWzBdLnZ5KVxuICAgICAgbW92ZUZvb2QobWVbMF0udngsIG1lWzBdLnZ5KVxuXG4gICAgICBjb29yZHNbMF0ueCArPSBtZVswXS52eFxuICAgICAgY29vcmRzWzBdLnkgKz0gbWVbMF0udnlcbiAgICAgIG9mZnNldC54ICs9IG1lWzBdLnZ4XG4gICAgICBvZmZzZXQueSArPSBtZVswXS52eVxuXG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IG1lLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICBkaXN0YW5jZS54ID0gY29vcmRzW2kgLSAxXS54IC0gY29vcmRzW2ldLnhcbiAgICAgICAgIGRpc3RhbmNlLnkgPSBjb29yZHNbaSAtIDFdLnkgLSBjb29yZHNbaV0ueVxuICAgICAgICAgZGlzdGFuY2UudG90YWwgPSBNYXRoLmh5cG90KGNvb3Jkc1tpIC0gMV0ueCAtIGNvb3Jkc1tpXS54LCBjb29yZHNbaSAtIDFdLnkgLSBjb29yZHNbaV0ueSlcbiAgICAgICAgIG1lW2ldLnJvdGF0aW9uID0gTWF0aC5hdGFuMihkaXN0YW5jZS55LCBkaXN0YW5jZS54KVxuICAgICAgICAgbWVbaV0udnggPSBNYXRoLmNvcyhtZVtpXS5yb3RhdGlvbikgKiBzcGVlZFxuICAgICAgICAgbWVbaV0udnkgPSBNYXRoLnNpbihtZVtpXS5yb3RhdGlvbikgKiBzcGVlZFxuXG4gICAgICAgICB2YXIgbmV3Q29vcmRzID0ge1xuICAgICAgICAgICAgeDogY29vcmRzW2ldLnggKyBtZVtpXS52eCAtIG9mZnNldC54LFxuICAgICAgICAgICAgeTogY29vcmRzW2ldLnkgKyBtZVtpXS52eSAtIG9mZnNldC55XG4gICAgICAgICB9XG5cbiAgICAgICAgIGlmIChkaXN0YW5jZS50b3RhbCA8IDUgKyBzcGVlZCkge1xuICAgICAgICAgICAgbmV3Q29vcmRzID0gaC5nZXROZXdQb2ludChuZXdDb29yZHMueCwgbmV3Q29vcmRzLnksIG1lW2ldLnJvdGF0aW9uLCAtc3BlZWQpXG4gICAgICAgICB9XG5cbiAgICAgICAgIGNvb3Jkc1tpXS54ID0gb2Zmc2V0LnggKyBuZXdDb29yZHMueFxuICAgICAgICAgY29vcmRzW2ldLnkgPSBvZmZzZXQueSArIG5ld0Nvb3Jkcy55XG4gICAgICAgICBtZVtpXS5wb3NpdGlvbi54ID0gbmV3Q29vcmRzLnhcbiAgICAgICAgIG1lW2ldLnBvc2l0aW9uLnkgPSBuZXdDb29yZHMueVxuXG4gICAgICB9XG4gICB9XG5cbiAgIGZ1bmN0aW9uIGNoZWNrRm9vZENvbGxpc2lvbnMgKCkge1xuICAgICAgaWYgKGZvb2QubGVuZ3RoID4gMCkge1xuICAgICAgICAgZm9vZC5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBpZiAoaC5jaXJjbGVDb2xsaXNpb24obWVbMF0sIGl0ZW0pKVxuICAgICAgICAgICAgICAgZWF0Rm9vZChpdGVtKVxuICAgICAgICAgfSlcbiAgICAgIH1cbiAgIH1cblxuICAgZnVuY3Rpb24gdXBkYXRlU2NvcmVUZXh0KHNjLHNpKSB7XG4gICAgICBzY29yZVRleHQudGV4dCA9IFwiU2NvcmU6IFwiICsgTWF0aC5yb3VuZChzYykgKyBcIlxcblNpemU6IFwiICsgc2lcbiAgIH1cblxuICAgZnVuY3Rpb24gZWF0Rm9vZCAoZikge1xuICAgICAgdmFyIGluZGV4ID0gZm9vZC5pbmRleE9mKGYpXG4gICAgICBzdGFnZS5yZW1vdmVDaGlsZChmKVxuICAgICAgc2NvcmUgKz0gKDEwICogZi5zY2FsZS54KVxuICAgICAgdXBkYXRlU2NvcmVUZXh0KHNjb3JlLHNxdWlybVNpemUpXG4gICAgICBmb29kLnNwbGljZShpbmRleCwgMSlcbiAgICAgIGNoZWNrR3Jvd3RoKClcbiAgIH1cblxuICAgZnVuY3Rpb24gY2hlY2tHcm93dGggKCkge1xuICAgICAgdmFyIG5ld1NpemUgPSBNYXRoLnJvdW5kKHNjb3JlIC8gMTApICsgMTBcblxuICAgICAgaWYgKG5ld1NpemUgPiBzcXVpcm1TaXplKSB7XG4gICAgICAgICB2YXIgZGlmZiA9IG5ld1NpemUgLSBzcXVpcm1TaXplXG4gICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpZmY7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5ld1NlZyA9IG5ldyBQSVhJLlNwcml0ZSh0ZXh0dXJlQm9keSlcbiAgICAgICAgICAgIHZhciBsYXN0ID0gbWUubGVuZ3RoIC0gMVxuICAgICAgICAgICAgbmV3U2VnLmFuY2hvci54ID0gLjVcbiAgICAgICAgICAgIG5ld1NlZy5hbmNob3IueSA9IC41XG4gICAgICAgICAgICBuZXdTZWcucG9zaXRpb24ueCA9IG1lW2xhc3RdLnBvc2l0aW9uLnhcbiAgICAgICAgICAgIG5ld1NlZy5wb3NpdGlvbi55ID0gbWVbbGFzdF0ucG9zaXRpb24ueVxuICAgICAgICAgICAgbmV3U2VnLnNjYWxlLnggPSAuNFxuICAgICAgICAgICAgbmV3U2VnLnNjYWxlLnkgPSAuNFxuICAgICAgICAgICAgbmV3U2VnLnpJbmRleCA9IG5ld1NpemUgKyAxMVxuICAgICAgICAgICAgc3RhZ2UuYWRkQ2hpbGQobmV3U2VnKVxuICAgICAgICAgICAgbWUucHVzaChuZXdTZWcpXG4gICAgICAgICAgICBjb29yZHMucHVzaCh7IHg6IGNvb3Jkc1tsYXN0XS54LCB5OiBjb29yZHNbbGFzdF0ueSB9KVxuICAgICAgICAgfVxuICAgICAgICAgZm9yIChpID0gMDsgaSA8IG1lLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBtZVtpXS56SW5kZXggPSBuZXdTaXplIC0gaSArIDEwXG4gICAgICAgICB9XG4gICAgICAgICBzcXVpcm1TaXplID0gbmV3U2l6ZVxuICAgICAgfVxuXG4gICB9XG5cbiAgIGZ1bmN0aW9uIG1vdmVCZyAoeCwgeSkge1xuICAgICAgYmcucG9zaXRpb24ueCAtPSB4XG4gICAgICBiZy5wb3NpdGlvbi55IC09IHlcbiAgIH1cblxuICAgZnVuY3Rpb24gbW92ZUZvb2QgKHgsIHkpIHtcbiAgICAgIGZvb2QuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgaXRlbS5wb3NpdGlvbi54IC09IHhcbiAgICAgICAgIGl0ZW0ucG9zaXRpb24ueSAtPSB5XG4gICAgICB9KVxuICAgfVxuXG4gICBmdW5jdGlvbiBidWlsZFNxdWlybWVyIChzaXplKSB7XG4gICAgICBzaXplID0gc2l6ZSA8IDEgPyAxIDogc2l6ZVxuXG4gICAgICAvLyB6aW5kZXggZm9yIGZhY2UgaXMgKHNpemUgKyAxMSlcbiAgICAgIC8vIHppbmRleCBmb3IgYm9keSBpcyAxMCB0byAoc2l6ZSArIDEwKVxuICAgICAgLy8gemluZGV4IGZvciBzY29yZVRleHQgaXMgNlxuICAgICAgLy8gemluZGV4IGZvciBmb29kIGlzIDVcbiAgICAgIC8vIHppZG5leCBmb3IgYmcgaXMgMVxuICAgICAgdmFyIHppID0gc2l6ZSArIDEwXG5cbiAgICAgIHZhciBmYWNlID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmVGYWNlKVxuICAgICAgZmFjZS5wb3NpdGlvbi54ID0gd2luLndpZHRoIC8gMlxuICAgICAgZmFjZS5wb3NpdGlvbi55ID0gd2luLmhlaWdodCAvIDJcbiAgICAgIGZhY2UuYW5jaG9yLnggPSAuNVxuICAgICAgZmFjZS5hbmNob3IueSA9IC41XG4gICAgICBmYWNlLnNjYWxlLnggPSAuNFxuICAgICAgZmFjZS5zY2FsZS55ID0gLjRcbiAgICAgIGZhY2UuekluZGV4ID0gemkgKyAxXG5cbiAgICAgIHZhciBib2R5ID0gW11cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICBib2R5W2ldID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmVCb2R5KVxuICAgICAgICAgYm9keVtpXS5hbmNob3IueCA9IC41XG4gICAgICAgICBib2R5W2ldLmFuY2hvci55ID0gLjVcbiAgICAgICAgIGJvZHlbaV0ucG9zaXRpb24ueCA9IGZhY2UucG9zaXRpb24ueFxuICAgICAgICAgYm9keVtpXS5wb3NpdGlvbi55ID0gZmFjZS5wb3NpdGlvbi55XG4gICAgICAgICBib2R5W2ldLnNjYWxlLnggPSAuNFxuICAgICAgICAgYm9keVtpXS5zY2FsZS55ID0gLjRcbiAgICAgICAgIGJvZHlbaV0uekluZGV4ID0gemkgLSBpXG4gICAgICB9XG5cbiAgICAgIG1lWzBdID0gZmFjZVxuXG4gICAgICBib2R5LmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgIG1lLnB1c2goaXRlbSlcbiAgICAgIH0pXG5cbiAgICAgIHZhciBhZGRlciA9IFtdLmNvbmNhdChtZSkucmV2ZXJzZSgpXG4gICAgICBhZGRlci5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICBzdGFnZS5hZGRDaGlsZChpdGVtKVxuICAgICAgfSlcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgY29vcmRzW2ldID0geyB4OiBtZVtpXS5wb3NpdGlvbi54LCB5OiBtZVtpXS5wb3NpdGlvbi55IH1cbiAgICAgIH1cbiAgIH1cblxuICAgZnVuY3Rpb24gbWFrZUZvb2QgKCkge1xuICAgICAgaWYgKGguZ2V0UmFuZCgxLCAxMDApID4gOTgpIHtcbiAgICAgICAgIHZhciBmU2NhbGUgPSBoLmdldFJhbmQoLjIsIC43KVxuICAgICAgICAgdmFyIG5ld0Zvb2QgPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZUZvb2QpXG4gICAgICAgICBuZXdGb29kLmFuY2hvci54ID0gLjVcbiAgICAgICAgIG5ld0Zvb2QuYW5jaG9yLnkgPSAuNVxuICAgICAgICAgbmV3Rm9vZC5wb3NpdGlvbi54ID0gaC5nZXRSYW5kKDAsIHdpbi53aWR0aClcbiAgICAgICAgIG5ld0Zvb2QucG9zaXRpb24ueSA9IGguZ2V0UmFuZCgwLCB3aW4uaGVpZ2h0KVxuICAgICAgICAgbmV3Rm9vZC5zY2FsZS54ID0gZlNjYWxlXG4gICAgICAgICBuZXdGb29kLnNjYWxlLnkgPSBmU2NhbGVcbiAgICAgICAgIG5ld0Zvb2QuekluZGV4ID0gNVxuXG4gICAgICAgICBmb29kLnB1c2gobmV3Rm9vZClcbiAgICAgICAgIHN0YWdlLmFkZENoaWxkKG5ld0Zvb2QpXG4gICAgICB9XG4gICB9XG5cblxuICAgZnVuY3Rpb24gbG9vcGVyICgpIHtcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wZXIpXG4gICAgICBzZWxmTW92ZW1lbnQoKVxuICAgICAgY2hlY2tGb29kQ29sbGlzaW9ucygpXG4gICAgICBtYWtlRm9vZCgpXG4gICAgICBzdGFnZS51cGRhdGVMYXllcnNPcmRlcigpXG4gICAgICByZW5kZXJlci5yZW5kZXIoc3RhZ2UpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIHJlc2l6ZSAoKSB7XG4gICAgICBpZiAod2luLndpZHRoICE9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCB8fCB3aW4uaGVpZ2h0ICE9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgIHdpbiA9IHtcbiAgICAgICAgICAgIHdpZHRoOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQsXG4gICAgICAgICAgICBtaWQ6IHtcbiAgICAgICAgICAgICAgIHg6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCAvIDIsXG4gICAgICAgICAgICAgICB5OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0IC8gMlxuICAgICAgICAgICAgfVxuICAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVuZGVyZXIucmVzaXplKHdpbi53aWR0aCwgd2luLmhlaWdodClcbiAgIH1cblxuICAgaW5pdCgpXG59KSgpIl19
