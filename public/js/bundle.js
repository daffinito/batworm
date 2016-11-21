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
(function () {
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
   var renderer = PIXI.autoDetectRenderer(win.width, win.height,{antialias: true})
   var stage = new PIXI.Container()
   var textureFace = PIXI.Texture.fromImage('images/batworm.png')
   var textureBody = PIXI.Texture.fromImage('images/batbody.png')
   var textureFood = PIXI.Texture.fromImage('images/circle2.png')
  // var ch = new PIXI.Sprite(PIXI.Texture.fromImage('images/crosshair.png'))
   var bg = new PIXI.Sprite(PIXI.Texture.fromImage('images/bg.jpg'))
   var score = 0
   var squirmSize = 0
   var scoreStyle = { fontFamily: "Arial", fontSize: 18, fill: "white", stroke: "black", strokeThickness: 4 }
   var scoreText = new PIXI.Text("Score: " + score + "\nSize: " + squirmSize, scoreStyle)
   var debugStyle = { fontFamily: "Arial", fontSize: 18, fill: "white", stroke: "black", strokeThickness: 4 }
   var debugText = new PIXI.Text("oldrads: " + 0 + "\nnewrads: " + 0, debugStyle)
   var me = []
   var others = []
   var othersCoords = []
   var numOfPlayers = 1
   var coords = []
   var food = []
   var mouse = renderer.plugins.interaction.eventData.data.global
   var baseSpeed = 3
   var overdrive = 1
   var wsOpen = false
   var playerNum = 0

   var host = window.document.location.host.replace(/:.*/, '')
   var ws = new WebSocket('ws://' + host + ':8080')

   ws.onmessage = function (event) {
      checkMsg(event.data)
   };

   ws.onopen = function (event) {
      wsOpen = true

   };

   document.body.appendChild(renderer.view)

   window.onresize = resize

   stage.updateLayersOrder = function () {
      stage.children.sort(function (a, b) {
         a.zIndex = a.zIndex || 0
         b.zIndex = b.zIndex || 0
         return a.zIndex - b.zIndex
      })
   }

   function init (x,y,size) {

      if (renderer.type === PIXI.RENDERER_TYPE.WEBGL) {
         console.log('Using WebGL')
      } else {
         console.log('Using Canvas')
      }

      setBackground(x,y)
      setScore()
      setDebug()
      buildSquirmer(x,y,size)
      looper()
   }

   function setBackground (x,y) {
      bg.position.x = x
      bg.position.y = y
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

  /*
      ch.position.x = win.mid.x
      ch.position.y = win.mid.y
      ch.anchor.x = .5
      ch.anchor.y = .5
      ch.zIndex = 10000
      stage.addChild(ch)
      */
   }

   function setScore () {
      scoreText.position.x = 0
      scoreText.position.y = win.height
      scoreText.anchor.x = 0
      scoreText.anchor.y = 1
      scoreText.zIndex = 10000
      stage.addChild(scoreText)
   }

   function setDebug () {
      debugText.position.x = win.width
      debugText.position.y = win.height
      debugText.anchor.x = 1
      debugText.anchor.y = 1
      debugText.zIndex = 10000
      stage.addChild(debugText)
   }

   function updateDebugText (o, n) {
      debugText.text = "oldrads: " + o.toFixed(2) + "\nnewrads: " + n.toFixed(2)
   }

   function sendToServer(data) {
      ws.send(data, function(err) {
         console.log("ERROR")
         console.log(err)
      })
   }

   function checkMsg (data) {
      try {
         data = JSON.parse(data)
      }
      catch(e) {
         console.log(e)
      }

      if (data.dataType == "initcon") {
         console.log(data)
         playerNum = data.playerNum
         squirmSize = data.size
         coords = data.coords
         init(coords[0].x, coords[0].y, squirmSize)
      }

      if (data.dataType == "movement") {
         var mecoords = []
         var players = []

         for (var i = 0; i < data.all.length; i++) {
            if (data.all[i].playerNum == playerNum) {
               mecoords = data.all[i].coords
            }
            else {
               players.push(data.all[i])
            }
         }

         var toffset = {
            x: coords[0].x - mecoords[0].x,
            y: coords[0].y - mecoords[0].y
         }

         offset.x -= toffset.x
         offset.y -= toffset.y

         moveBg(toffset.x, toffset.y)
         moveFood(toffset.x, toffset.y)
         coords = mecoords

         for (i = 0; i < coords.length; i++) {
            me[i].rotation = coords[i].rotation
            me[i].position.x = coords[i].x - offset.x
            me[i].position.y = coords[i].y - offset.y
         }
         checkOthers(players)
      }
   }

   function checkOthers(players) {
      var alreadyExists
      othersCoords = players
      if (othersCoords.length > 0) {
         for (var i = 0; i < othersCoords.length; i++) {
            alreadyExists = false
            for (var ii = 0; ii < others.length; ii++) {
               if (othersCoords[i].playerNum == others[ii].playerNum) {
                  alreadyExists = true
                  moveOther(ii,othersCoords[i])
               }
            }
            if (!alreadyExists) {
               var size = othersCoords[i].coords.length - 1
               createOther(othersCoords[i], size)
            }
         }
      }
      var notPlaying
      if (others.length > 0) {
         for (i = 0; i < others.length; i++) {
            notPlaying = true
            for (ii = 0; ii < othersCoords.length; ii++) {
               if (others[i].playerNum == othersCoords[ii].playerNum) {
                  notPlaying = false
               }
            }
            if (notPlaying) {
               for (var a = 0; a < others[i].length; a++) {
                  stage.removeChild(others[i][a])
               }
               others.splice(i,1)
            }
         }
      }
   }

   function moveOther(oindex,coords) {
      for (var i = 0; i < others[oindex].length; i++) {
         others[oindex][i].rotation = coords.coords[i].rotation
         others[oindex][i].position.x = coords.coords[i].x - offset.x
         others[oindex][i].position.y = coords.coords[i].y - offset.y
      }
   }

   function createOther(other,size) {
      var zi = size + 10
      var face = new PIXI.Sprite(textureFace)
      face.position.x = other.coords[0].x - offset.x
      face.position.y = other.coords[0].y - offset.y
      face.anchor.x = .5
      face.anchor.y = .5
      face.scale.x = .4
      face.scale.y = .4
      face.zIndex = 9000

      var body = []
      for (var i = 0; i < size; i++) {
         body[i] = new PIXI.Sprite(textureBody)
         body[i].anchor.x = .5
         body[i].anchor.y = .5
         body[i].position.x = other.coords[i+1].x - offset.x
         body[i].position.y = other.coords[i+1].y - offset.y
         body[i].scale.x = .4
         body[i].scale.y = .4
         body[i].zIndex = zi - i
      }

      var index = others.length
         others[index] = []

      others[index][0] = face
      body.forEach(function (item) {
         others[index].push(item)
      })

      others[index].playerNum = other.playerNum

      var adder = [].concat(others[index]).reverse()
      adder.forEach(function (item) {
         stage.addChild(item)
      })
   }

   function movement() {
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
      var direction = undefined

      updateDebugText(oldrads, newrads)

      // breaking the screen up into 4 quads to determine direction
      if (((oldrads <= 0 && Math.abs(oldrads) >= h.rightAngle()) && (newrads <= 0 && Math.abs(newrads) >= h.rightAngle())) ||
         ((oldrads >= 0 && Math.abs(oldrads) >= h.rightAngle()) && (newrads >= 0 && Math.abs(newrads) >= h.rightAngle())) ||
         ((oldrads <= 0 && Math.abs(oldrads) <= h.rightAngle()) && (newrads <= 0 && Math.abs(newrads) <= h.rightAngle())) ||
         ((oldrads >= 0 && Math.abs(oldrads) <= h.rightAngle()) && (newrads >= 0 && Math.abs(newrads) <= h.rightAngle())))
      {
         // console.log("SAME QUAD NAV")
         if (oldrads < newrads) {
            if (direction != undefined) {
               console.log("DIRECTION WAS: " + direction)
               console.log("DIRECTION NOW: cw")
            }
            direction = "cw"
         }
         if (oldrads > newrads) {
            if (direction != undefined) {
               console.log("DIRECTION WAS: " + direction)
               console.log("DIRECTION NOW: ccw")
            }
            direction = "ccw"

         }
      }

      if (((oldrads <= 0 && Math.abs(oldrads) >= h.rightAngle()) && (newrads <= 0 && Math.abs(newrads) <= h.rightAngle())) ||
         ((oldrads >= 0 && Math.abs(oldrads) >= h.rightAngle()) && (newrads >= 0 && Math.abs(newrads) <= h.rightAngle())) ||
         ((oldrads <= 0 && Math.abs(oldrads) <= h.rightAngle()) && (newrads >= 0 && Math.abs(newrads) <= h.rightAngle())) ||
         ((oldrads >= 0 && Math.abs(oldrads) >= h.rightAngle()) && (newrads <= 0 && Math.abs(newrads) >= h.rightAngle())))
      {
         if (direction != undefined) {
            console.log("DIRECTION WAS: " + direction)
            console.log("DIRECTION NOW: cw")
         }
         direction = "cw"
      }
      if (((oldrads <= 0 && Math.abs(oldrads) <= h.rightAngle()) && (newrads <= 0 && Math.abs(newrads) >= h.rightAngle())) ||
         ((oldrads >= 0 && Math.abs(oldrads) <= h.rightAngle()) && (newrads >= 0 && Math.abs(newrads) >= h.rightAngle())) ||
         ((oldrads <= 0 && Math.abs(oldrads) >= h.rightAngle()) && (newrads >= 0 && Math.abs(newrads) >= h.rightAngle())) ||
         ((oldrads >= 0 && Math.abs(oldrads) <= h.rightAngle()) && (newrads <= 0 && Math.abs(newrads) <= h.rightAngle())))
      {
         if (direction != undefined) {
            console.log("DIRECTION WAS: " + direction)
            console.log("DIRECTION NOW: ccw")
         }
         direction = "ccw"
      }

      if (direction === undefined) {
         console.log("direction is undefined!")
      }

      var data = {
         dataType: "movement",
         curRads: oldrads,
         newRads: newrads,
         direction: direction,
         speed: speed,
         coords: coords
      }

      sendToServer(JSON.stringify(data))
   }

   function checkFoodCollisions () {
      if (food.length > 0) {
         food.forEach(function (item) {
            if (h.circleCollision(me[0], item)) {
               eatFood(item)
            }
         })
      }
   }

   function updateScoreText (sc, si) {
      scoreText.text = "Score: " + Math.round(sc) + "\nSize: " + si
   }

   function eatFood (f) {
      var index = food.indexOf(f)
      stage.removeChild(f)
      score += (10 * f.scale.x)
      updateScoreText(score, squirmSize)
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
      bg.position.x += x
      bg.position.y += y
   }

   function moveFood (x, y) {
      food.forEach(function (item) {
         item.position.x += x
         item.position.y += y
      })
   }

   function buildSquirmer (x,y,size) {
      size = size < 1 ? 1 : size

      // zindex for scoreText is 10000
      // zindex for face is 9000
      // zindex for body is 10 to (size + 10)
      // zindex for food is 5
      // zidnex for bg is 1
      var zi = size + 10

      offset.x = x - win.mid.x
      offset.y = y - win.mid.y

      var face = new PIXI.Sprite(textureFace)
      face.position.x = win.mid.x
      face.position.y = win.mid.y
      face.anchor.x = .5
      face.anchor.y = .5
      face.scale.x = .4
      face.scale.y = .4
      face.zIndex = 9000

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
      if (wsOpen) {
         movement()
     //    checkFoodCollisions()
     //    makeFood()
         stage.updateLayersOrder()
      }
      renderer.render(stage)
   }

   function resize () {
      if (win.width != document.documentElement.clientWidth || win.height != document.documentElement.clientHeight) {
         var xdiff = (win.width - document.documentElement.clientWidth)
         var ydiff = (win.height - document.documentElement.clientHeight)
         offset.x += (xdiff / 2)
         offset.y += (ydiff / 2)
         moveBg(-xdiff/2,-ydiff/2)
         moveFood(-xdiff/2,-ydiff/2)
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
})()
},{"./helper":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyL2NvcmUuanMiLCJicm93c2VyL2hlbHBlci5qcyIsImJyb3dzZXIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInJlcXVpcmUoJy4vbWFpbicpXG4iLCJ2YXIgckFuZ2xlID0gOTAgKiAoTWF0aC5QSSAvIDE4MClcbnZhciBzTGluZSA9IDE4MCAqIChNYXRoLlBJIC8gMTgwKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgIGdldFJhbmQ6IGZ1bmN0aW9uIChtaW4sIG1heCkge1xuICAgICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbjtcbiAgIH0sXG4gICBnZXROZXdQb2ludDogZnVuY3Rpb24gKHgsIHksIGFuZ2xlLCBkaXN0YW5jZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgIHg6ICsoTWF0aC5jb3MoYW5nbGUpICogZGlzdGFuY2UgKyB4KS50b0ZpeGVkKDIpLFxuICAgICAgICAgeTogKyhNYXRoLnNpbihhbmdsZSkgKiBkaXN0YW5jZSArIHkpLnRvRml4ZWQoMilcbiAgICAgIH1cbiAgIH0sXG4gICByYWQyZGVnOiBmdW5jdGlvbiAocmFkcykge1xuICAgICAgcmV0dXJuIHJhZHMgKiAoMTgwIC8gTWF0aC5QSSk7XG4gICB9LFxuICAgZGVnMnJhZDogZnVuY3Rpb24gKGRlZykge1xuICAgICAgcmV0dXJuIGRlZyAqIChNYXRoLlBJIC8gMTgwKVxuICAgfSxcbiAgIHJpZ2h0QW5nbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiByQW5nbGVcbiAgIH0sXG4gICBzdHJMaW5lOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gc0xpbmVcbiAgIH0sXG4gICB0ZXN0Q29sbGlzaW9uOiBmdW5jdGlvbiAocjEsIHIyKSB7XG4gICAgICB2YXIgY29tYmluZWRIYWxmV2lkdGhzLCBjb21iaW5lZEhhbGZIZWlnaHRzLCB2eCwgdnk7XG5cbiAgICAgIHIxLmNlbnRlclggPSByMS5wb3NpdGlvbi54ICsgcjEud2lkdGggLyAyO1xuICAgICAgcjEuY2VudGVyWSA9IHIxLnBvc2l0aW9uLnkgKyByMS5oZWlnaHQgLyAyO1xuICAgICAgcjIuY2VudGVyWCA9IHIyLnBvc2l0aW9uLnggKyByMi53aWR0aCAvIDI7XG4gICAgICByMi5jZW50ZXJZID0gcjIucG9zaXRpb24ueSArIHIyLmhlaWdodCAvIDI7XG5cbiAgICAgIHIxLmhhbGZXaWR0aCA9IHIxLndpZHRoIC8gMjtcbiAgICAgIHIxLmhhbGZIZWlnaHQgPSByMS5oZWlnaHQgLyAyO1xuICAgICAgcjIuaGFsZldpZHRoID0gcjIud2lkdGggLyAyO1xuICAgICAgcjIuaGFsZkhlaWdodCA9IHIyLmhlaWdodCAvIDI7XG5cbiAgICAgIHZ4ID0gcjEuY2VudGVyWCAtIHIyLmNlbnRlclg7XG4gICAgICB2eSA9IHIxLmNlbnRlclkgLSByMi5jZW50ZXJZO1xuXG4gICAgICBjb21iaW5lZEhhbGZXaWR0aHMgPSByMS5oYWxmV2lkdGggKyByMi5oYWxmV2lkdGg7XG4gICAgICBjb21iaW5lZEhhbGZIZWlnaHRzID0gcjEuaGFsZkhlaWdodCArIHIyLmhhbGZIZWlnaHQ7XG5cbiAgICAgIHJldHVybiAoTWF0aC5hYnModngpIDwgY29tYmluZWRIYWxmV2lkdGhzICYmIE1hdGguYWJzKHZ5KSA8IGNvbWJpbmVkSGFsZkhlaWdodHMpXG4gICB9LFxuICAgY2lyY2xlQ29sbGlzaW9uOiBmdW5jdGlvbihyMSwgcjIpIHtcbiAgICAgIHZhciBkeCA9IHIxLnBvc2l0aW9uLnggLSByMi5wb3NpdGlvbi54O1xuICAgICAgdmFyIGR5ID0gcjEucG9zaXRpb24ueSAtIHIyLnBvc2l0aW9uLnk7XG4gICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXG4gICAgICByZXR1cm4gKGRpc3RhbmNlIDwgKHIxLndpZHRoIC8gMikgKyAocjIud2lkdGggLyAyKSlcbiAgIH1cbn0iLCIoZnVuY3Rpb24gKCkge1xuICAgdmFyIGggPSByZXF1aXJlKCcuL2hlbHBlcicpXG4gICB2YXIgd2luID0ge1xuICAgICAgd2lkdGg6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCxcbiAgICAgIGhlaWdodDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCxcbiAgICAgIG1pZDoge1xuICAgICAgICAgeDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIC8gMixcbiAgICAgICAgIHk6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgLyAyXG4gICAgICB9XG4gICB9XG4gICB2YXIgb2Zmc2V0ID0geyB4OiAwLCB5OiAwIH1cbiAgIHZhciByZW5kZXJlciA9IFBJWEkuYXV0b0RldGVjdFJlbmRlcmVyKHdpbi53aWR0aCwgd2luLmhlaWdodCx7YW50aWFsaWFzOiB0cnVlfSlcbiAgIHZhciBzdGFnZSA9IG5ldyBQSVhJLkNvbnRhaW5lcigpXG4gICB2YXIgdGV4dHVyZUZhY2UgPSBQSVhJLlRleHR1cmUuZnJvbUltYWdlKCdpbWFnZXMvYmF0d29ybS5wbmcnKVxuICAgdmFyIHRleHR1cmVCb2R5ID0gUElYSS5UZXh0dXJlLmZyb21JbWFnZSgnaW1hZ2VzL2JhdGJvZHkucG5nJylcbiAgIHZhciB0ZXh0dXJlRm9vZCA9IFBJWEkuVGV4dHVyZS5mcm9tSW1hZ2UoJ2ltYWdlcy9jaXJjbGUyLnBuZycpXG4gIC8vIHZhciBjaCA9IG5ldyBQSVhJLlNwcml0ZShQSVhJLlRleHR1cmUuZnJvbUltYWdlKCdpbWFnZXMvY3Jvc3NoYWlyLnBuZycpKVxuICAgdmFyIGJnID0gbmV3IFBJWEkuU3ByaXRlKFBJWEkuVGV4dHVyZS5mcm9tSW1hZ2UoJ2ltYWdlcy9iZy5qcGcnKSlcbiAgIHZhciBzY29yZSA9IDBcbiAgIHZhciBzcXVpcm1TaXplID0gMFxuICAgdmFyIHNjb3JlU3R5bGUgPSB7IGZvbnRGYW1pbHk6IFwiQXJpYWxcIiwgZm9udFNpemU6IDE4LCBmaWxsOiBcIndoaXRlXCIsIHN0cm9rZTogXCJibGFja1wiLCBzdHJva2VUaGlja25lc3M6IDQgfVxuICAgdmFyIHNjb3JlVGV4dCA9IG5ldyBQSVhJLlRleHQoXCJTY29yZTogXCIgKyBzY29yZSArIFwiXFxuU2l6ZTogXCIgKyBzcXVpcm1TaXplLCBzY29yZVN0eWxlKVxuICAgdmFyIGRlYnVnU3R5bGUgPSB7IGZvbnRGYW1pbHk6IFwiQXJpYWxcIiwgZm9udFNpemU6IDE4LCBmaWxsOiBcIndoaXRlXCIsIHN0cm9rZTogXCJibGFja1wiLCBzdHJva2VUaGlja25lc3M6IDQgfVxuICAgdmFyIGRlYnVnVGV4dCA9IG5ldyBQSVhJLlRleHQoXCJvbGRyYWRzOiBcIiArIDAgKyBcIlxcbm5ld3JhZHM6IFwiICsgMCwgZGVidWdTdHlsZSlcbiAgIHZhciBtZSA9IFtdXG4gICB2YXIgb3RoZXJzID0gW11cbiAgIHZhciBvdGhlcnNDb29yZHMgPSBbXVxuICAgdmFyIG51bU9mUGxheWVycyA9IDFcbiAgIHZhciBjb29yZHMgPSBbXVxuICAgdmFyIGZvb2QgPSBbXVxuICAgdmFyIG1vdXNlID0gcmVuZGVyZXIucGx1Z2lucy5pbnRlcmFjdGlvbi5ldmVudERhdGEuZGF0YS5nbG9iYWxcbiAgIHZhciBiYXNlU3BlZWQgPSAzXG4gICB2YXIgb3ZlcmRyaXZlID0gMVxuICAgdmFyIHdzT3BlbiA9IGZhbHNlXG4gICB2YXIgcGxheWVyTnVtID0gMFxuXG4gICB2YXIgaG9zdCA9IHdpbmRvdy5kb2N1bWVudC5sb2NhdGlvbi5ob3N0LnJlcGxhY2UoLzouKi8sICcnKVxuICAgdmFyIHdzID0gbmV3IFdlYlNvY2tldCgnd3M6Ly8nICsgaG9zdCArICc6ODA4MCcpXG5cbiAgIHdzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgY2hlY2tNc2coZXZlbnQuZGF0YSlcbiAgIH07XG5cbiAgIHdzLm9ub3BlbiA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgd3NPcGVuID0gdHJ1ZVxuXG4gICB9O1xuXG4gICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJlbmRlcmVyLnZpZXcpXG5cbiAgIHdpbmRvdy5vbnJlc2l6ZSA9IHJlc2l6ZVxuXG4gICBzdGFnZS51cGRhdGVMYXllcnNPcmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHN0YWdlLmNoaWxkcmVuLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgIGEuekluZGV4ID0gYS56SW5kZXggfHwgMFxuICAgICAgICAgYi56SW5kZXggPSBiLnpJbmRleCB8fCAwXG4gICAgICAgICByZXR1cm4gYS56SW5kZXggLSBiLnpJbmRleFxuICAgICAgfSlcbiAgIH1cblxuICAgZnVuY3Rpb24gaW5pdCAoeCx5LHNpemUpIHtcblxuICAgICAgaWYgKHJlbmRlcmVyLnR5cGUgPT09IFBJWEkuUkVOREVSRVJfVFlQRS5XRUJHTCkge1xuICAgICAgICAgY29uc29sZS5sb2coJ1VzaW5nIFdlYkdMJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICBjb25zb2xlLmxvZygnVXNpbmcgQ2FudmFzJylcbiAgICAgIH1cblxuICAgICAgc2V0QmFja2dyb3VuZCh4LHkpXG4gICAgICBzZXRTY29yZSgpXG4gICAgICBzZXREZWJ1ZygpXG4gICAgICBidWlsZFNxdWlybWVyKHgseSxzaXplKVxuICAgICAgbG9vcGVyKClcbiAgIH1cblxuICAgZnVuY3Rpb24gc2V0QmFja2dyb3VuZCAoeCx5KSB7XG4gICAgICBiZy5wb3NpdGlvbi54ID0geFxuICAgICAgYmcucG9zaXRpb24ueSA9IHlcbiAgICAgIGJnLmFuY2hvci54ID0gLjVcbiAgICAgIGJnLmFuY2hvci55ID0gLjVcbiAgICAgIGJnLnpJbmRleCA9IDFcbiAgICAgIGJnLmludGVyYWN0aXZlID0gdHJ1ZVxuICAgICAgYmcub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIG92ZXJkcml2ZSA9IDJcbiAgICAgIH0pXG4gICAgICBiZy5vbignbW91c2V1cCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIG92ZXJkcml2ZSA9IDFcbiAgICAgIH0pXG5cbiAgICAgIHN0YWdlLmFkZENoaWxkKGJnKVxuXG4gIC8qXG4gICAgICBjaC5wb3NpdGlvbi54ID0gd2luLm1pZC54XG4gICAgICBjaC5wb3NpdGlvbi55ID0gd2luLm1pZC55XG4gICAgICBjaC5hbmNob3IueCA9IC41XG4gICAgICBjaC5hbmNob3IueSA9IC41XG4gICAgICBjaC56SW5kZXggPSAxMDAwMFxuICAgICAgc3RhZ2UuYWRkQ2hpbGQoY2gpXG4gICAgICAqL1xuICAgfVxuXG4gICBmdW5jdGlvbiBzZXRTY29yZSAoKSB7XG4gICAgICBzY29yZVRleHQucG9zaXRpb24ueCA9IDBcbiAgICAgIHNjb3JlVGV4dC5wb3NpdGlvbi55ID0gd2luLmhlaWdodFxuICAgICAgc2NvcmVUZXh0LmFuY2hvci54ID0gMFxuICAgICAgc2NvcmVUZXh0LmFuY2hvci55ID0gMVxuICAgICAgc2NvcmVUZXh0LnpJbmRleCA9IDEwMDAwXG4gICAgICBzdGFnZS5hZGRDaGlsZChzY29yZVRleHQpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIHNldERlYnVnICgpIHtcbiAgICAgIGRlYnVnVGV4dC5wb3NpdGlvbi54ID0gd2luLndpZHRoXG4gICAgICBkZWJ1Z1RleHQucG9zaXRpb24ueSA9IHdpbi5oZWlnaHRcbiAgICAgIGRlYnVnVGV4dC5hbmNob3IueCA9IDFcbiAgICAgIGRlYnVnVGV4dC5hbmNob3IueSA9IDFcbiAgICAgIGRlYnVnVGV4dC56SW5kZXggPSAxMDAwMFxuICAgICAgc3RhZ2UuYWRkQ2hpbGQoZGVidWdUZXh0KVxuICAgfVxuXG4gICBmdW5jdGlvbiB1cGRhdGVEZWJ1Z1RleHQgKG8sIG4pIHtcbiAgICAgIGRlYnVnVGV4dC50ZXh0ID0gXCJvbGRyYWRzOiBcIiArIG8udG9GaXhlZCgyKSArIFwiXFxubmV3cmFkczogXCIgKyBuLnRvRml4ZWQoMilcbiAgIH1cblxuICAgZnVuY3Rpb24gc2VuZFRvU2VydmVyKGRhdGEpIHtcbiAgICAgIHdzLnNlbmQoZGF0YSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICBjb25zb2xlLmxvZyhcIkVSUk9SXCIpXG4gICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICB9KVxuICAgfVxuXG4gICBmdW5jdGlvbiBjaGVja01zZyAoZGF0YSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpXG4gICAgICB9XG4gICAgICBjYXRjaChlKSB7XG4gICAgICAgICBjb25zb2xlLmxvZyhlKVxuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5kYXRhVHlwZSA9PSBcImluaXRjb25cIikge1xuICAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgIHBsYXllck51bSA9IGRhdGEucGxheWVyTnVtXG4gICAgICAgICBzcXVpcm1TaXplID0gZGF0YS5zaXplXG4gICAgICAgICBjb29yZHMgPSBkYXRhLmNvb3Jkc1xuICAgICAgICAgaW5pdChjb29yZHNbMF0ueCwgY29vcmRzWzBdLnksIHNxdWlybVNpemUpXG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLmRhdGFUeXBlID09IFwibW92ZW1lbnRcIikge1xuICAgICAgICAgdmFyIG1lY29vcmRzID0gW11cbiAgICAgICAgIHZhciBwbGF5ZXJzID0gW11cblxuICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmFsbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGRhdGEuYWxsW2ldLnBsYXllck51bSA9PSBwbGF5ZXJOdW0pIHtcbiAgICAgICAgICAgICAgIG1lY29vcmRzID0gZGF0YS5hbGxbaV0uY29vcmRzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgIHBsYXllcnMucHVzaChkYXRhLmFsbFtpXSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH1cblxuICAgICAgICAgdmFyIHRvZmZzZXQgPSB7XG4gICAgICAgICAgICB4OiBjb29yZHNbMF0ueCAtIG1lY29vcmRzWzBdLngsXG4gICAgICAgICAgICB5OiBjb29yZHNbMF0ueSAtIG1lY29vcmRzWzBdLnlcbiAgICAgICAgIH1cblxuICAgICAgICAgb2Zmc2V0LnggLT0gdG9mZnNldC54XG4gICAgICAgICBvZmZzZXQueSAtPSB0b2Zmc2V0LnlcblxuICAgICAgICAgbW92ZUJnKHRvZmZzZXQueCwgdG9mZnNldC55KVxuICAgICAgICAgbW92ZUZvb2QodG9mZnNldC54LCB0b2Zmc2V0LnkpXG4gICAgICAgICBjb29yZHMgPSBtZWNvb3Jkc1xuXG4gICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBtZVtpXS5yb3RhdGlvbiA9IGNvb3Jkc1tpXS5yb3RhdGlvblxuICAgICAgICAgICAgbWVbaV0ucG9zaXRpb24ueCA9IGNvb3Jkc1tpXS54IC0gb2Zmc2V0LnhcbiAgICAgICAgICAgIG1lW2ldLnBvc2l0aW9uLnkgPSBjb29yZHNbaV0ueSAtIG9mZnNldC55XG4gICAgICAgICB9XG4gICAgICAgICBjaGVja090aGVycyhwbGF5ZXJzKVxuICAgICAgfVxuICAgfVxuXG4gICBmdW5jdGlvbiBjaGVja090aGVycyhwbGF5ZXJzKSB7XG4gICAgICB2YXIgYWxyZWFkeUV4aXN0c1xuICAgICAgb3RoZXJzQ29vcmRzID0gcGxheWVyc1xuICAgICAgaWYgKG90aGVyc0Nvb3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG90aGVyc0Nvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYWxyZWFkeUV4aXN0cyA9IGZhbHNlXG4gICAgICAgICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgb3RoZXJzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgaWYgKG90aGVyc0Nvb3Jkc1tpXS5wbGF5ZXJOdW0gPT0gb3RoZXJzW2lpXS5wbGF5ZXJOdW0pIHtcbiAgICAgICAgICAgICAgICAgIGFscmVhZHlFeGlzdHMgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBtb3ZlT3RoZXIoaWksb3RoZXJzQ29vcmRzW2ldKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFhbHJlYWR5RXhpc3RzKSB7XG4gICAgICAgICAgICAgICB2YXIgc2l6ZSA9IG90aGVyc0Nvb3Jkc1tpXS5jb29yZHMubGVuZ3RoIC0gMVxuICAgICAgICAgICAgICAgY3JlYXRlT3RoZXIob3RoZXJzQ29vcmRzW2ldLCBzaXplKVxuICAgICAgICAgICAgfVxuICAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFyIG5vdFBsYXlpbmdcbiAgICAgIGlmIChvdGhlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgZm9yIChpID0gMDsgaSA8IG90aGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbm90UGxheWluZyA9IHRydWVcbiAgICAgICAgICAgIGZvciAoaWkgPSAwOyBpaSA8IG90aGVyc0Nvb3Jkcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgIGlmIChvdGhlcnNbaV0ucGxheWVyTnVtID09IG90aGVyc0Nvb3Jkc1tpaV0ucGxheWVyTnVtKSB7XG4gICAgICAgICAgICAgICAgICBub3RQbGF5aW5nID0gZmFsc2VcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub3RQbGF5aW5nKSB7XG4gICAgICAgICAgICAgICBmb3IgKHZhciBhID0gMDsgYSA8IG90aGVyc1tpXS5sZW5ndGg7IGErKykge1xuICAgICAgICAgICAgICAgICAgc3RhZ2UucmVtb3ZlQ2hpbGQob3RoZXJzW2ldW2FdKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgb3RoZXJzLnNwbGljZShpLDEpXG4gICAgICAgICAgICB9XG4gICAgICAgICB9XG4gICAgICB9XG4gICB9XG5cbiAgIGZ1bmN0aW9uIG1vdmVPdGhlcihvaW5kZXgsY29vcmRzKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG90aGVyc1tvaW5kZXhdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICBvdGhlcnNbb2luZGV4XVtpXS5yb3RhdGlvbiA9IGNvb3Jkcy5jb29yZHNbaV0ucm90YXRpb25cbiAgICAgICAgIG90aGVyc1tvaW5kZXhdW2ldLnBvc2l0aW9uLnggPSBjb29yZHMuY29vcmRzW2ldLnggLSBvZmZzZXQueFxuICAgICAgICAgb3RoZXJzW29pbmRleF1baV0ucG9zaXRpb24ueSA9IGNvb3Jkcy5jb29yZHNbaV0ueSAtIG9mZnNldC55XG4gICAgICB9XG4gICB9XG5cbiAgIGZ1bmN0aW9uIGNyZWF0ZU90aGVyKG90aGVyLHNpemUpIHtcbiAgICAgIHZhciB6aSA9IHNpemUgKyAxMFxuICAgICAgdmFyIGZhY2UgPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZUZhY2UpXG4gICAgICBmYWNlLnBvc2l0aW9uLnggPSBvdGhlci5jb29yZHNbMF0ueCAtIG9mZnNldC54XG4gICAgICBmYWNlLnBvc2l0aW9uLnkgPSBvdGhlci5jb29yZHNbMF0ueSAtIG9mZnNldC55XG4gICAgICBmYWNlLmFuY2hvci54ID0gLjVcbiAgICAgIGZhY2UuYW5jaG9yLnkgPSAuNVxuICAgICAgZmFjZS5zY2FsZS54ID0gLjRcbiAgICAgIGZhY2Uuc2NhbGUueSA9IC40XG4gICAgICBmYWNlLnpJbmRleCA9IDkwMDBcblxuICAgICAgdmFyIGJvZHkgPSBbXVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgIGJvZHlbaV0gPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZUJvZHkpXG4gICAgICAgICBib2R5W2ldLmFuY2hvci54ID0gLjVcbiAgICAgICAgIGJvZHlbaV0uYW5jaG9yLnkgPSAuNVxuICAgICAgICAgYm9keVtpXS5wb3NpdGlvbi54ID0gb3RoZXIuY29vcmRzW2krMV0ueCAtIG9mZnNldC54XG4gICAgICAgICBib2R5W2ldLnBvc2l0aW9uLnkgPSBvdGhlci5jb29yZHNbaSsxXS55IC0gb2Zmc2V0LnlcbiAgICAgICAgIGJvZHlbaV0uc2NhbGUueCA9IC40XG4gICAgICAgICBib2R5W2ldLnNjYWxlLnkgPSAuNFxuICAgICAgICAgYm9keVtpXS56SW5kZXggPSB6aSAtIGlcbiAgICAgIH1cblxuICAgICAgdmFyIGluZGV4ID0gb3RoZXJzLmxlbmd0aFxuICAgICAgICAgb3RoZXJzW2luZGV4XSA9IFtdXG5cbiAgICAgIG90aGVyc1tpbmRleF1bMF0gPSBmYWNlXG4gICAgICBib2R5LmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgIG90aGVyc1tpbmRleF0ucHVzaChpdGVtKVxuICAgICAgfSlcblxuICAgICAgb3RoZXJzW2luZGV4XS5wbGF5ZXJOdW0gPSBvdGhlci5wbGF5ZXJOdW1cblxuICAgICAgdmFyIGFkZGVyID0gW10uY29uY2F0KG90aGVyc1tpbmRleF0pLnJldmVyc2UoKVxuICAgICAgYWRkZXIuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgc3RhZ2UuYWRkQ2hpbGQoaXRlbSlcbiAgICAgIH0pXG4gICB9XG5cbiAgIGZ1bmN0aW9uIG1vdmVtZW50KCkge1xuICAgICAgdmFyIHNwZWVkID0gYmFzZVNwZWVkICogb3ZlcmRyaXZlXG4gICAgICB2YXIgZGlzdGFuY2UgPSB7XG4gICAgICAgICB0b3RhbDogMCxcbiAgICAgICAgIHg6IDAsXG4gICAgICAgICB5OiAwXG4gICAgICB9XG4gICAgICBkaXN0YW5jZS54ID0gbW91c2UueCAtIHdpbi5taWQueFxuICAgICAgZGlzdGFuY2UueSA9IG1vdXNlLnkgLSB3aW4ubWlkLnlcbiAgICAgIHZhciBvbGRyYWRzID0gK21lWzBdLnJvdGF0aW9uLnRvRml4ZWQoMilcbiAgICAgIHZhciBuZXdyYWRzID0gTWF0aC5hdGFuMihkaXN0YW5jZS55LCBkaXN0YW5jZS54KVxuICAgICAgdmFyIGRpcmVjdGlvbiA9IHVuZGVmaW5lZFxuXG4gICAgICB1cGRhdGVEZWJ1Z1RleHQob2xkcmFkcywgbmV3cmFkcylcblxuICAgICAgLy8gYnJlYWtpbmcgdGhlIHNjcmVlbiB1cCBpbnRvIDQgcXVhZHMgdG8gZGV0ZXJtaW5lIGRpcmVjdGlvblxuICAgICAgaWYgKCgob2xkcmFkcyA8PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpID49IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA8PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpID49IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA+PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpID49IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA+PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpID49IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA8PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA8PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA+PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA+PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSkpXG4gICAgICB7XG4gICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlNBTUUgUVVBRCBOQVZcIilcbiAgICAgICAgIGlmIChvbGRyYWRzIDwgbmV3cmFkcykge1xuICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIFdBUzogXCIgKyBkaXJlY3Rpb24pXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRJUkVDVElPTiBOT1c6IGN3XCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXJlY3Rpb24gPSBcImN3XCJcbiAgICAgICAgIH1cbiAgICAgICAgIGlmIChvbGRyYWRzID4gbmV3cmFkcykge1xuICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIFdBUzogXCIgKyBkaXJlY3Rpb24pXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRJUkVDVElPTiBOT1c6IGNjd1wiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlyZWN0aW9uID0gXCJjY3dcIlxuXG4gICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgoKG9sZHJhZHMgPD0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPD0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPj0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPj0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPD0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPj0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPj0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPD0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkpKVxuICAgICAge1xuICAgICAgICAgaWYgKGRpcmVjdGlvbiAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIFdBUzogXCIgKyBkaXJlY3Rpb24pXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRJUkVDVElPTiBOT1c6IGN3XCIpXG4gICAgICAgICB9XG4gICAgICAgICBkaXJlY3Rpb24gPSBcImN3XCJcbiAgICAgIH1cbiAgICAgIGlmICgoKG9sZHJhZHMgPD0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPD0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPj0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPj0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPD0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPj0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPj0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPD0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkpKVxuICAgICAge1xuICAgICAgICAgaWYgKGRpcmVjdGlvbiAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIFdBUzogXCIgKyBkaXJlY3Rpb24pXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRJUkVDVElPTiBOT1c6IGNjd1wiKVxuICAgICAgICAgfVxuICAgICAgICAgZGlyZWN0aW9uID0gXCJjY3dcIlxuICAgICAgfVxuXG4gICAgICBpZiAoZGlyZWN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgIGNvbnNvbGUubG9nKFwiZGlyZWN0aW9uIGlzIHVuZGVmaW5lZCFcIilcbiAgICAgIH1cblxuICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICBkYXRhVHlwZTogXCJtb3ZlbWVudFwiLFxuICAgICAgICAgY3VyUmFkczogb2xkcmFkcyxcbiAgICAgICAgIG5ld1JhZHM6IG5ld3JhZHMsXG4gICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbixcbiAgICAgICAgIHNwZWVkOiBzcGVlZCxcbiAgICAgICAgIGNvb3JkczogY29vcmRzXG4gICAgICB9XG5cbiAgICAgIHNlbmRUb1NlcnZlcihKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgIH1cblxuICAgZnVuY3Rpb24gY2hlY2tGb29kQ29sbGlzaW9ucyAoKSB7XG4gICAgICBpZiAoZm9vZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICBmb29kLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIGlmIChoLmNpcmNsZUNvbGxpc2lvbihtZVswXSwgaXRlbSkpIHtcbiAgICAgICAgICAgICAgIGVhdEZvb2QoaXRlbSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH0pXG4gICAgICB9XG4gICB9XG5cbiAgIGZ1bmN0aW9uIHVwZGF0ZVNjb3JlVGV4dCAoc2MsIHNpKSB7XG4gICAgICBzY29yZVRleHQudGV4dCA9IFwiU2NvcmU6IFwiICsgTWF0aC5yb3VuZChzYykgKyBcIlxcblNpemU6IFwiICsgc2lcbiAgIH1cblxuICAgZnVuY3Rpb24gZWF0Rm9vZCAoZikge1xuICAgICAgdmFyIGluZGV4ID0gZm9vZC5pbmRleE9mKGYpXG4gICAgICBzdGFnZS5yZW1vdmVDaGlsZChmKVxuICAgICAgc2NvcmUgKz0gKDEwICogZi5zY2FsZS54KVxuICAgICAgdXBkYXRlU2NvcmVUZXh0KHNjb3JlLCBzcXVpcm1TaXplKVxuICAgICAgZm9vZC5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICBjaGVja0dyb3d0aCgpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIGNoZWNrR3Jvd3RoICgpIHtcbiAgICAgIHZhciBuZXdTaXplID0gTWF0aC5yb3VuZChzY29yZSAvIDEwKSArIDEwXG4gICAgICBpZiAobmV3U2l6ZSA+IHNxdWlybVNpemUpIHtcbiAgICAgICAgIHZhciBkaWZmID0gbmV3U2l6ZSAtIHNxdWlybVNpemVcbiAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlmZjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbmV3U2VnID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmVCb2R5KVxuICAgICAgICAgICAgdmFyIGxhc3QgPSBtZS5sZW5ndGggLSAxXG4gICAgICAgICAgICBuZXdTZWcuYW5jaG9yLnggPSAuNVxuICAgICAgICAgICAgbmV3U2VnLmFuY2hvci55ID0gLjVcbiAgICAgICAgICAgIG5ld1NlZy5wb3NpdGlvbi54ID0gbWVbbGFzdF0ucG9zaXRpb24ueFxuICAgICAgICAgICAgbmV3U2VnLnBvc2l0aW9uLnkgPSBtZVtsYXN0XS5wb3NpdGlvbi55XG4gICAgICAgICAgICBuZXdTZWcuc2NhbGUueCA9IC40XG4gICAgICAgICAgICBuZXdTZWcuc2NhbGUueSA9IC40XG4gICAgICAgICAgICBuZXdTZWcuekluZGV4ID0gbmV3U2l6ZSArIDExXG4gICAgICAgICAgICBzdGFnZS5hZGRDaGlsZChuZXdTZWcpXG4gICAgICAgICAgICBtZS5wdXNoKG5ld1NlZylcbiAgICAgICAgICAgIGNvb3Jkcy5wdXNoKHsgeDogY29vcmRzW2xhc3RdLngsIHk6IGNvb3Jkc1tsYXN0XS55IH0pXG4gICAgICAgICB9XG4gICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG1lW2ldLnpJbmRleCA9IG5ld1NpemUgLSBpICsgMTBcbiAgICAgICAgIH1cbiAgICAgICAgIHNxdWlybVNpemUgPSBuZXdTaXplXG4gICAgICB9XG4gICB9XG5cbiAgIGZ1bmN0aW9uIG1vdmVCZyAoeCwgeSkge1xuICAgICAgYmcucG9zaXRpb24ueCArPSB4XG4gICAgICBiZy5wb3NpdGlvbi55ICs9IHlcbiAgIH1cblxuICAgZnVuY3Rpb24gbW92ZUZvb2QgKHgsIHkpIHtcbiAgICAgIGZvb2QuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgaXRlbS5wb3NpdGlvbi54ICs9IHhcbiAgICAgICAgIGl0ZW0ucG9zaXRpb24ueSArPSB5XG4gICAgICB9KVxuICAgfVxuXG4gICBmdW5jdGlvbiBidWlsZFNxdWlybWVyICh4LHksc2l6ZSkge1xuICAgICAgc2l6ZSA9IHNpemUgPCAxID8gMSA6IHNpemVcblxuICAgICAgLy8gemluZGV4IGZvciBzY29yZVRleHQgaXMgMTAwMDBcbiAgICAgIC8vIHppbmRleCBmb3IgZmFjZSBpcyA5MDAwXG4gICAgICAvLyB6aW5kZXggZm9yIGJvZHkgaXMgMTAgdG8gKHNpemUgKyAxMClcbiAgICAgIC8vIHppbmRleCBmb3IgZm9vZCBpcyA1XG4gICAgICAvLyB6aWRuZXggZm9yIGJnIGlzIDFcbiAgICAgIHZhciB6aSA9IHNpemUgKyAxMFxuXG4gICAgICBvZmZzZXQueCA9IHggLSB3aW4ubWlkLnhcbiAgICAgIG9mZnNldC55ID0geSAtIHdpbi5taWQueVxuXG4gICAgICB2YXIgZmFjZSA9IG5ldyBQSVhJLlNwcml0ZSh0ZXh0dXJlRmFjZSlcbiAgICAgIGZhY2UucG9zaXRpb24ueCA9IHdpbi5taWQueFxuICAgICAgZmFjZS5wb3NpdGlvbi55ID0gd2luLm1pZC55XG4gICAgICBmYWNlLmFuY2hvci54ID0gLjVcbiAgICAgIGZhY2UuYW5jaG9yLnkgPSAuNVxuICAgICAgZmFjZS5zY2FsZS54ID0gLjRcbiAgICAgIGZhY2Uuc2NhbGUueSA9IC40XG4gICAgICBmYWNlLnpJbmRleCA9IDkwMDBcblxuICAgICAgdmFyIGJvZHkgPSBbXVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgIGJvZHlbaV0gPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZUJvZHkpXG4gICAgICAgICBib2R5W2ldLmFuY2hvci54ID0gLjVcbiAgICAgICAgIGJvZHlbaV0uYW5jaG9yLnkgPSAuNVxuICAgICAgICAgYm9keVtpXS5wb3NpdGlvbi54ID0gZmFjZS5wb3NpdGlvbi54XG4gICAgICAgICBib2R5W2ldLnBvc2l0aW9uLnkgPSBmYWNlLnBvc2l0aW9uLnlcbiAgICAgICAgIGJvZHlbaV0uc2NhbGUueCA9IC40XG4gICAgICAgICBib2R5W2ldLnNjYWxlLnkgPSAuNFxuICAgICAgICAgYm9keVtpXS56SW5kZXggPSB6aSAtIGlcbiAgICAgIH1cblxuICAgICAgbWVbMF0gPSBmYWNlXG4gICAgICBib2R5LmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgIG1lLnB1c2goaXRlbSlcbiAgICAgIH0pXG5cbiAgICAgIHZhciBhZGRlciA9IFtdLmNvbmNhdChtZSkucmV2ZXJzZSgpXG4gICAgICBhZGRlci5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICBzdGFnZS5hZGRDaGlsZChpdGVtKVxuICAgICAgfSlcbiAgIH1cblxuICAgZnVuY3Rpb24gbWFrZUZvb2QgKCkge1xuICAgICAgaWYgKGguZ2V0UmFuZCgxLCAxMDApID4gOTgpIHtcbiAgICAgICAgIHZhciBmU2NhbGUgPSBoLmdldFJhbmQoLjIsIC43KVxuICAgICAgICAgdmFyIG5ld0Zvb2QgPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZUZvb2QpXG4gICAgICAgICBuZXdGb29kLmFuY2hvci54ID0gLjVcbiAgICAgICAgIG5ld0Zvb2QuYW5jaG9yLnkgPSAuNVxuICAgICAgICAgbmV3Rm9vZC5wb3NpdGlvbi54ID0gaC5nZXRSYW5kKDAsIHdpbi53aWR0aClcbiAgICAgICAgIG5ld0Zvb2QucG9zaXRpb24ueSA9IGguZ2V0UmFuZCgwLCB3aW4uaGVpZ2h0KVxuICAgICAgICAgbmV3Rm9vZC5zY2FsZS54ID0gZlNjYWxlXG4gICAgICAgICBuZXdGb29kLnNjYWxlLnkgPSBmU2NhbGVcbiAgICAgICAgIG5ld0Zvb2QuekluZGV4ID0gNVxuICAgICAgICAgZm9vZC5wdXNoKG5ld0Zvb2QpXG4gICAgICAgICBzdGFnZS5hZGRDaGlsZChuZXdGb29kKVxuICAgICAgfVxuICAgfVxuXG4gICBmdW5jdGlvbiBsb29wZXIgKCkge1xuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3BlcilcbiAgICAgIGlmICh3c09wZW4pIHtcbiAgICAgICAgIG1vdmVtZW50KClcbiAgICAgLy8gICAgY2hlY2tGb29kQ29sbGlzaW9ucygpXG4gICAgIC8vICAgIG1ha2VGb29kKClcbiAgICAgICAgIHN0YWdlLnVwZGF0ZUxheWVyc09yZGVyKClcbiAgICAgIH1cbiAgICAgIHJlbmRlcmVyLnJlbmRlcihzdGFnZSlcbiAgIH1cblxuICAgZnVuY3Rpb24gcmVzaXplICgpIHtcbiAgICAgIGlmICh3aW4ud2lkdGggIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIHx8IHdpbi5oZWlnaHQgIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgICAgdmFyIHhkaWZmID0gKHdpbi53aWR0aCAtIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aClcbiAgICAgICAgIHZhciB5ZGlmZiA9ICh3aW4uaGVpZ2h0IC0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodClcbiAgICAgICAgIG9mZnNldC54ICs9ICh4ZGlmZiAvIDIpXG4gICAgICAgICBvZmZzZXQueSArPSAoeWRpZmYgLyAyKVxuICAgICAgICAgbW92ZUJnKC14ZGlmZi8yLC15ZGlmZi8yKVxuICAgICAgICAgbW92ZUZvb2QoLXhkaWZmLzIsLXlkaWZmLzIpXG4gICAgICAgICB3aW4gPSB7XG4gICAgICAgICAgICB3aWR0aDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0LFxuICAgICAgICAgICAgbWlkOiB7XG4gICAgICAgICAgICAgICB4OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggLyAyLFxuICAgICAgICAgICAgICAgeTogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCAvIDJcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlbmRlcmVyLnJlc2l6ZSh3aW4ud2lkdGgsIHdpbi5oZWlnaHQpXG4gICB9XG59KSgpIl19
