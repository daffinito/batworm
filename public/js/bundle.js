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

   var HOST = location.origin.replace(/^http/, 'ws')
   var ws = new WebSocket(HOST);

 //  var host = location.origin.replace(/:.*/, '')
 //  var ws = new WebSocket('ws://' + host + ':8080')

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
      var oldrads = me[0].rotation == undefined ? 0 : +me[0].rotation.toFixed(2)
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
         speed: overdrive,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyL2NvcmUuanMiLCJicm93c2VyL2hlbHBlci5qcyIsImJyb3dzZXIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInJlcXVpcmUoJy4vbWFpbicpXG4iLCJ2YXIgckFuZ2xlID0gOTAgKiAoTWF0aC5QSSAvIDE4MClcbnZhciBzTGluZSA9IDE4MCAqIChNYXRoLlBJIC8gMTgwKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgIGdldFJhbmQ6IGZ1bmN0aW9uIChtaW4sIG1heCkge1xuICAgICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbjtcbiAgIH0sXG4gICBnZXROZXdQb2ludDogZnVuY3Rpb24gKHgsIHksIGFuZ2xlLCBkaXN0YW5jZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgIHg6ICsoTWF0aC5jb3MoYW5nbGUpICogZGlzdGFuY2UgKyB4KS50b0ZpeGVkKDIpLFxuICAgICAgICAgeTogKyhNYXRoLnNpbihhbmdsZSkgKiBkaXN0YW5jZSArIHkpLnRvRml4ZWQoMilcbiAgICAgIH1cbiAgIH0sXG4gICByYWQyZGVnOiBmdW5jdGlvbiAocmFkcykge1xuICAgICAgcmV0dXJuIHJhZHMgKiAoMTgwIC8gTWF0aC5QSSk7XG4gICB9LFxuICAgZGVnMnJhZDogZnVuY3Rpb24gKGRlZykge1xuICAgICAgcmV0dXJuIGRlZyAqIChNYXRoLlBJIC8gMTgwKVxuICAgfSxcbiAgIHJpZ2h0QW5nbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiByQW5nbGVcbiAgIH0sXG4gICBzdHJMaW5lOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gc0xpbmVcbiAgIH0sXG4gICB0ZXN0Q29sbGlzaW9uOiBmdW5jdGlvbiAocjEsIHIyKSB7XG4gICAgICB2YXIgY29tYmluZWRIYWxmV2lkdGhzLCBjb21iaW5lZEhhbGZIZWlnaHRzLCB2eCwgdnk7XG5cbiAgICAgIHIxLmNlbnRlclggPSByMS5wb3NpdGlvbi54ICsgcjEud2lkdGggLyAyO1xuICAgICAgcjEuY2VudGVyWSA9IHIxLnBvc2l0aW9uLnkgKyByMS5oZWlnaHQgLyAyO1xuICAgICAgcjIuY2VudGVyWCA9IHIyLnBvc2l0aW9uLnggKyByMi53aWR0aCAvIDI7XG4gICAgICByMi5jZW50ZXJZID0gcjIucG9zaXRpb24ueSArIHIyLmhlaWdodCAvIDI7XG5cbiAgICAgIHIxLmhhbGZXaWR0aCA9IHIxLndpZHRoIC8gMjtcbiAgICAgIHIxLmhhbGZIZWlnaHQgPSByMS5oZWlnaHQgLyAyO1xuICAgICAgcjIuaGFsZldpZHRoID0gcjIud2lkdGggLyAyO1xuICAgICAgcjIuaGFsZkhlaWdodCA9IHIyLmhlaWdodCAvIDI7XG5cbiAgICAgIHZ4ID0gcjEuY2VudGVyWCAtIHIyLmNlbnRlclg7XG4gICAgICB2eSA9IHIxLmNlbnRlclkgLSByMi5jZW50ZXJZO1xuXG4gICAgICBjb21iaW5lZEhhbGZXaWR0aHMgPSByMS5oYWxmV2lkdGggKyByMi5oYWxmV2lkdGg7XG4gICAgICBjb21iaW5lZEhhbGZIZWlnaHRzID0gcjEuaGFsZkhlaWdodCArIHIyLmhhbGZIZWlnaHQ7XG5cbiAgICAgIHJldHVybiAoTWF0aC5hYnModngpIDwgY29tYmluZWRIYWxmV2lkdGhzICYmIE1hdGguYWJzKHZ5KSA8IGNvbWJpbmVkSGFsZkhlaWdodHMpXG4gICB9LFxuICAgY2lyY2xlQ29sbGlzaW9uOiBmdW5jdGlvbihyMSwgcjIpIHtcbiAgICAgIHZhciBkeCA9IHIxLnBvc2l0aW9uLnggLSByMi5wb3NpdGlvbi54O1xuICAgICAgdmFyIGR5ID0gcjEucG9zaXRpb24ueSAtIHIyLnBvc2l0aW9uLnk7XG4gICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXG4gICAgICByZXR1cm4gKGRpc3RhbmNlIDwgKHIxLndpZHRoIC8gMikgKyAocjIud2lkdGggLyAyKSlcbiAgIH1cbn0iLCIoZnVuY3Rpb24gKCkge1xuICAgdmFyIGggPSByZXF1aXJlKCcuL2hlbHBlcicpXG4gICB2YXIgd2luID0ge1xuICAgICAgd2lkdGg6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCxcbiAgICAgIGhlaWdodDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCxcbiAgICAgIG1pZDoge1xuICAgICAgICAgeDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIC8gMixcbiAgICAgICAgIHk6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgLyAyXG4gICAgICB9XG4gICB9XG4gICB2YXIgb2Zmc2V0ID0geyB4OiAwLCB5OiAwIH1cbiAgIHZhciByZW5kZXJlciA9IFBJWEkuYXV0b0RldGVjdFJlbmRlcmVyKHdpbi53aWR0aCwgd2luLmhlaWdodCx7YW50aWFsaWFzOiB0cnVlfSlcbiAgIHZhciBzdGFnZSA9IG5ldyBQSVhJLkNvbnRhaW5lcigpXG4gICB2YXIgdGV4dHVyZUZhY2UgPSBQSVhJLlRleHR1cmUuZnJvbUltYWdlKCdpbWFnZXMvYmF0d29ybS5wbmcnKVxuICAgdmFyIHRleHR1cmVCb2R5ID0gUElYSS5UZXh0dXJlLmZyb21JbWFnZSgnaW1hZ2VzL2JhdGJvZHkucG5nJylcbiAgIHZhciB0ZXh0dXJlRm9vZCA9IFBJWEkuVGV4dHVyZS5mcm9tSW1hZ2UoJ2ltYWdlcy9jaXJjbGUyLnBuZycpXG4gIC8vIHZhciBjaCA9IG5ldyBQSVhJLlNwcml0ZShQSVhJLlRleHR1cmUuZnJvbUltYWdlKCdpbWFnZXMvY3Jvc3NoYWlyLnBuZycpKVxuICAgdmFyIGJnID0gbmV3IFBJWEkuU3ByaXRlKFBJWEkuVGV4dHVyZS5mcm9tSW1hZ2UoJ2ltYWdlcy9iZy5qcGcnKSlcbiAgIHZhciBzY29yZSA9IDBcbiAgIHZhciBzcXVpcm1TaXplID0gMFxuICAgdmFyIHNjb3JlU3R5bGUgPSB7IGZvbnRGYW1pbHk6IFwiQXJpYWxcIiwgZm9udFNpemU6IDE4LCBmaWxsOiBcIndoaXRlXCIsIHN0cm9rZTogXCJibGFja1wiLCBzdHJva2VUaGlja25lc3M6IDQgfVxuICAgdmFyIHNjb3JlVGV4dCA9IG5ldyBQSVhJLlRleHQoXCJTY29yZTogXCIgKyBzY29yZSArIFwiXFxuU2l6ZTogXCIgKyBzcXVpcm1TaXplLCBzY29yZVN0eWxlKVxuICAgdmFyIGRlYnVnU3R5bGUgPSB7IGZvbnRGYW1pbHk6IFwiQXJpYWxcIiwgZm9udFNpemU6IDE4LCBmaWxsOiBcIndoaXRlXCIsIHN0cm9rZTogXCJibGFja1wiLCBzdHJva2VUaGlja25lc3M6IDQgfVxuICAgdmFyIGRlYnVnVGV4dCA9IG5ldyBQSVhJLlRleHQoXCJvbGRyYWRzOiBcIiArIDAgKyBcIlxcbm5ld3JhZHM6IFwiICsgMCwgZGVidWdTdHlsZSlcbiAgIHZhciBtZSA9IFtdXG4gICB2YXIgb3RoZXJzID0gW11cbiAgIHZhciBvdGhlcnNDb29yZHMgPSBbXVxuICAgdmFyIG51bU9mUGxheWVycyA9IDFcbiAgIHZhciBjb29yZHMgPSBbXVxuICAgdmFyIGZvb2QgPSBbXVxuICAgdmFyIG1vdXNlID0gcmVuZGVyZXIucGx1Z2lucy5pbnRlcmFjdGlvbi5ldmVudERhdGEuZGF0YS5nbG9iYWxcbiAgIHZhciBiYXNlU3BlZWQgPSAzXG4gICB2YXIgb3ZlcmRyaXZlID0gMVxuICAgdmFyIHdzT3BlbiA9IGZhbHNlXG4gICB2YXIgcGxheWVyTnVtID0gMFxuXG4gICB2YXIgSE9TVCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKC9eaHR0cC8sICd3cycpXG4gICB2YXIgd3MgPSBuZXcgV2ViU29ja2V0KEhPU1QpO1xuXG4gLy8gIHZhciBob3N0ID0gbG9jYXRpb24ub3JpZ2luLnJlcGxhY2UoLzouKi8sICcnKVxuIC8vICB2YXIgd3MgPSBuZXcgV2ViU29ja2V0KCd3czovLycgKyBob3N0ICsgJzo4MDgwJylcblxuICAgd3Mub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBjaGVja01zZyhldmVudC5kYXRhKVxuICAgfTtcblxuICAgd3Mub25vcGVuID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICB3c09wZW4gPSB0cnVlXG5cbiAgIH07XG5cbiAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocmVuZGVyZXIudmlldylcblxuICAgd2luZG93Lm9ucmVzaXplID0gcmVzaXplXG5cbiAgIHN0YWdlLnVwZGF0ZUxheWVyc09yZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgc3RhZ2UuY2hpbGRyZW4uc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgYS56SW5kZXggPSBhLnpJbmRleCB8fCAwXG4gICAgICAgICBiLnpJbmRleCA9IGIuekluZGV4IHx8IDBcbiAgICAgICAgIHJldHVybiBhLnpJbmRleCAtIGIuekluZGV4XG4gICAgICB9KVxuICAgfVxuXG4gICBmdW5jdGlvbiBpbml0ICh4LHksc2l6ZSkge1xuXG4gICAgICBpZiAocmVuZGVyZXIudHlwZSA9PT0gUElYSS5SRU5ERVJFUl9UWVBFLldFQkdMKSB7XG4gICAgICAgICBjb25zb2xlLmxvZygnVXNpbmcgV2ViR0wnKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgIGNvbnNvbGUubG9nKCdVc2luZyBDYW52YXMnKVxuICAgICAgfVxuXG4gICAgICBzZXRCYWNrZ3JvdW5kKHgseSlcbiAgICAgIHNldFNjb3JlKClcbiAgICAgIHNldERlYnVnKClcbiAgICAgIGJ1aWxkU3F1aXJtZXIoeCx5LHNpemUpXG4gICAgICBsb29wZXIoKVxuICAgfVxuXG4gICBmdW5jdGlvbiBzZXRCYWNrZ3JvdW5kICh4LHkpIHtcbiAgICAgIGJnLnBvc2l0aW9uLnggPSB4XG4gICAgICBiZy5wb3NpdGlvbi55ID0geVxuICAgICAgYmcuYW5jaG9yLnggPSAuNVxuICAgICAgYmcuYW5jaG9yLnkgPSAuNVxuICAgICAgYmcuekluZGV4ID0gMVxuICAgICAgYmcuaW50ZXJhY3RpdmUgPSB0cnVlXG4gICAgICBiZy5vbignbW91c2Vkb3duJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgb3ZlcmRyaXZlID0gMlxuICAgICAgfSlcbiAgICAgIGJnLm9uKCdtb3VzZXVwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgb3ZlcmRyaXZlID0gMVxuICAgICAgfSlcblxuICAgICAgc3RhZ2UuYWRkQ2hpbGQoYmcpXG5cbiAgLypcbiAgICAgIGNoLnBvc2l0aW9uLnggPSB3aW4ubWlkLnhcbiAgICAgIGNoLnBvc2l0aW9uLnkgPSB3aW4ubWlkLnlcbiAgICAgIGNoLmFuY2hvci54ID0gLjVcbiAgICAgIGNoLmFuY2hvci55ID0gLjVcbiAgICAgIGNoLnpJbmRleCA9IDEwMDAwXG4gICAgICBzdGFnZS5hZGRDaGlsZChjaClcbiAgICAgICovXG4gICB9XG5cbiAgIGZ1bmN0aW9uIHNldFNjb3JlICgpIHtcbiAgICAgIHNjb3JlVGV4dC5wb3NpdGlvbi54ID0gMFxuICAgICAgc2NvcmVUZXh0LnBvc2l0aW9uLnkgPSB3aW4uaGVpZ2h0XG4gICAgICBzY29yZVRleHQuYW5jaG9yLnggPSAwXG4gICAgICBzY29yZVRleHQuYW5jaG9yLnkgPSAxXG4gICAgICBzY29yZVRleHQuekluZGV4ID0gMTAwMDBcbiAgICAgIHN0YWdlLmFkZENoaWxkKHNjb3JlVGV4dClcbiAgIH1cblxuICAgZnVuY3Rpb24gc2V0RGVidWcgKCkge1xuICAgICAgZGVidWdUZXh0LnBvc2l0aW9uLnggPSB3aW4ud2lkdGhcbiAgICAgIGRlYnVnVGV4dC5wb3NpdGlvbi55ID0gd2luLmhlaWdodFxuICAgICAgZGVidWdUZXh0LmFuY2hvci54ID0gMVxuICAgICAgZGVidWdUZXh0LmFuY2hvci55ID0gMVxuICAgICAgZGVidWdUZXh0LnpJbmRleCA9IDEwMDAwXG4gICAgICBzdGFnZS5hZGRDaGlsZChkZWJ1Z1RleHQpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIHVwZGF0ZURlYnVnVGV4dCAobywgbikge1xuICAgICAgZGVidWdUZXh0LnRleHQgPSBcIm9sZHJhZHM6IFwiICsgby50b0ZpeGVkKDIpICsgXCJcXG5uZXdyYWRzOiBcIiArIG4udG9GaXhlZCgyKVxuICAgfVxuXG4gICBmdW5jdGlvbiBzZW5kVG9TZXJ2ZXIoZGF0YSkge1xuICAgICAgd3Muc2VuZChkYXRhLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgIGNvbnNvbGUubG9nKFwiRVJST1JcIilcbiAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgIH0pXG4gICB9XG5cbiAgIGZ1bmN0aW9uIGNoZWNrTXNnIChkYXRhKSB7XG4gICAgICB0cnkge1xuICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZGF0YSlcbiAgICAgIH1cbiAgICAgIGNhdGNoKGUpIHtcbiAgICAgICAgIGNvbnNvbGUubG9nKGUpXG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLmRhdGFUeXBlID09IFwiaW5pdGNvblwiKSB7XG4gICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICAgcGxheWVyTnVtID0gZGF0YS5wbGF5ZXJOdW1cbiAgICAgICAgIHNxdWlybVNpemUgPSBkYXRhLnNpemVcbiAgICAgICAgIGNvb3JkcyA9IGRhdGEuY29vcmRzXG4gICAgICAgICBpbml0KGNvb3Jkc1swXS54LCBjb29yZHNbMF0ueSwgc3F1aXJtU2l6ZSlcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuZGF0YVR5cGUgPT0gXCJtb3ZlbWVudFwiKSB7XG4gICAgICAgICB2YXIgbWVjb29yZHMgPSBbXVxuICAgICAgICAgdmFyIHBsYXllcnMgPSBbXVxuXG4gICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEuYWxsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5hbGxbaV0ucGxheWVyTnVtID09IHBsYXllck51bSkge1xuICAgICAgICAgICAgICAgbWVjb29yZHMgPSBkYXRhLmFsbFtpXS5jb29yZHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgcGxheWVycy5wdXNoKGRhdGEuYWxsW2ldKVxuICAgICAgICAgICAgfVxuICAgICAgICAgfVxuXG4gICAgICAgICB2YXIgdG9mZnNldCA9IHtcbiAgICAgICAgICAgIHg6IGNvb3Jkc1swXS54IC0gbWVjb29yZHNbMF0ueCxcbiAgICAgICAgICAgIHk6IGNvb3Jkc1swXS55IC0gbWVjb29yZHNbMF0ueVxuICAgICAgICAgfVxuXG4gICAgICAgICBvZmZzZXQueCAtPSB0b2Zmc2V0LnhcbiAgICAgICAgIG9mZnNldC55IC09IHRvZmZzZXQueVxuXG4gICAgICAgICBtb3ZlQmcodG9mZnNldC54LCB0b2Zmc2V0LnkpXG4gICAgICAgICBtb3ZlRm9vZCh0b2Zmc2V0LngsIHRvZmZzZXQueSlcbiAgICAgICAgIGNvb3JkcyA9IG1lY29vcmRzXG5cbiAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG1lW2ldLnJvdGF0aW9uID0gY29vcmRzW2ldLnJvdGF0aW9uXG4gICAgICAgICAgICBtZVtpXS5wb3NpdGlvbi54ID0gY29vcmRzW2ldLnggLSBvZmZzZXQueFxuICAgICAgICAgICAgbWVbaV0ucG9zaXRpb24ueSA9IGNvb3Jkc1tpXS55IC0gb2Zmc2V0LnlcbiAgICAgICAgIH1cbiAgICAgICAgIGNoZWNrT3RoZXJzKHBsYXllcnMpXG4gICAgICB9XG4gICB9XG5cbiAgIGZ1bmN0aW9uIGNoZWNrT3RoZXJzKHBsYXllcnMpIHtcbiAgICAgIHZhciBhbHJlYWR5RXhpc3RzXG4gICAgICBvdGhlcnNDb29yZHMgPSBwbGF5ZXJzXG4gICAgICBpZiAob3RoZXJzQ29vcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3RoZXJzQ29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhbHJlYWR5RXhpc3RzID0gZmFsc2VcbiAgICAgICAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBvdGhlcnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICBpZiAob3RoZXJzQ29vcmRzW2ldLnBsYXllck51bSA9PSBvdGhlcnNbaWldLnBsYXllck51bSkge1xuICAgICAgICAgICAgICAgICAgYWxyZWFkeUV4aXN0cyA9IHRydWVcbiAgICAgICAgICAgICAgICAgIG1vdmVPdGhlcihpaSxvdGhlcnNDb29yZHNbaV0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFscmVhZHlFeGlzdHMpIHtcbiAgICAgICAgICAgICAgIHZhciBzaXplID0gb3RoZXJzQ29vcmRzW2ldLmNvb3Jkcy5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICBjcmVhdGVPdGhlcihvdGhlcnNDb29yZHNbaV0sIHNpemUpXG4gICAgICAgICAgICB9XG4gICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgbm90UGxheWluZ1xuICAgICAgaWYgKG90aGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICBmb3IgKGkgPSAwOyBpIDwgb3RoZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub3RQbGF5aW5nID0gdHJ1ZVxuICAgICAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgb3RoZXJzQ29vcmRzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgaWYgKG90aGVyc1tpXS5wbGF5ZXJOdW0gPT0gb3RoZXJzQ29vcmRzW2lpXS5wbGF5ZXJOdW0pIHtcbiAgICAgICAgICAgICAgICAgIG5vdFBsYXlpbmcgPSBmYWxzZVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vdFBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgIGZvciAodmFyIGEgPSAwOyBhIDwgb3RoZXJzW2ldLmxlbmd0aDsgYSsrKSB7XG4gICAgICAgICAgICAgICAgICBzdGFnZS5yZW1vdmVDaGlsZChvdGhlcnNbaV1bYV0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBvdGhlcnMuc3BsaWNlKGksMSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgIH1cbiAgIH1cblxuICAgZnVuY3Rpb24gbW92ZU90aGVyKG9pbmRleCxjb29yZHMpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3RoZXJzW29pbmRleF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgIG90aGVyc1tvaW5kZXhdW2ldLnJvdGF0aW9uID0gY29vcmRzLmNvb3Jkc1tpXS5yb3RhdGlvblxuICAgICAgICAgb3RoZXJzW29pbmRleF1baV0ucG9zaXRpb24ueCA9IGNvb3Jkcy5jb29yZHNbaV0ueCAtIG9mZnNldC54XG4gICAgICAgICBvdGhlcnNbb2luZGV4XVtpXS5wb3NpdGlvbi55ID0gY29vcmRzLmNvb3Jkc1tpXS55IC0gb2Zmc2V0LnlcbiAgICAgIH1cbiAgIH1cblxuICAgZnVuY3Rpb24gY3JlYXRlT3RoZXIob3RoZXIsc2l6ZSkge1xuICAgICAgdmFyIHppID0gc2l6ZSArIDEwXG4gICAgICB2YXIgZmFjZSA9IG5ldyBQSVhJLlNwcml0ZSh0ZXh0dXJlRmFjZSlcbiAgICAgIGZhY2UucG9zaXRpb24ueCA9IG90aGVyLmNvb3Jkc1swXS54IC0gb2Zmc2V0LnhcbiAgICAgIGZhY2UucG9zaXRpb24ueSA9IG90aGVyLmNvb3Jkc1swXS55IC0gb2Zmc2V0LnlcbiAgICAgIGZhY2UuYW5jaG9yLnggPSAuNVxuICAgICAgZmFjZS5hbmNob3IueSA9IC41XG4gICAgICBmYWNlLnNjYWxlLnggPSAuNFxuICAgICAgZmFjZS5zY2FsZS55ID0gLjRcbiAgICAgIGZhY2UuekluZGV4ID0gOTAwMFxuXG4gICAgICB2YXIgYm9keSA9IFtdXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgYm9keVtpXSA9IG5ldyBQSVhJLlNwcml0ZSh0ZXh0dXJlQm9keSlcbiAgICAgICAgIGJvZHlbaV0uYW5jaG9yLnggPSAuNVxuICAgICAgICAgYm9keVtpXS5hbmNob3IueSA9IC41XG4gICAgICAgICBib2R5W2ldLnBvc2l0aW9uLnggPSBvdGhlci5jb29yZHNbaSsxXS54IC0gb2Zmc2V0LnhcbiAgICAgICAgIGJvZHlbaV0ucG9zaXRpb24ueSA9IG90aGVyLmNvb3Jkc1tpKzFdLnkgLSBvZmZzZXQueVxuICAgICAgICAgYm9keVtpXS5zY2FsZS54ID0gLjRcbiAgICAgICAgIGJvZHlbaV0uc2NhbGUueSA9IC40XG4gICAgICAgICBib2R5W2ldLnpJbmRleCA9IHppIC0gaVxuICAgICAgfVxuXG4gICAgICB2YXIgaW5kZXggPSBvdGhlcnMubGVuZ3RoXG4gICAgICAgICBvdGhlcnNbaW5kZXhdID0gW11cblxuICAgICAgb3RoZXJzW2luZGV4XVswXSA9IGZhY2VcbiAgICAgIGJvZHkuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgb3RoZXJzW2luZGV4XS5wdXNoKGl0ZW0pXG4gICAgICB9KVxuXG4gICAgICBvdGhlcnNbaW5kZXhdLnBsYXllck51bSA9IG90aGVyLnBsYXllck51bVxuXG4gICAgICB2YXIgYWRkZXIgPSBbXS5jb25jYXQob3RoZXJzW2luZGV4XSkucmV2ZXJzZSgpXG4gICAgICBhZGRlci5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICBzdGFnZS5hZGRDaGlsZChpdGVtKVxuICAgICAgfSlcbiAgIH1cblxuICAgZnVuY3Rpb24gbW92ZW1lbnQoKSB7XG4gICAgICB2YXIgc3BlZWQgPSBiYXNlU3BlZWQgKiBvdmVyZHJpdmVcbiAgICAgIHZhciBkaXN0YW5jZSA9IHtcbiAgICAgICAgIHRvdGFsOiAwLFxuICAgICAgICAgeDogMCxcbiAgICAgICAgIHk6IDBcbiAgICAgIH1cbiAgICAgIGRpc3RhbmNlLnggPSBtb3VzZS54IC0gd2luLm1pZC54XG4gICAgICBkaXN0YW5jZS55ID0gbW91c2UueSAtIHdpbi5taWQueVxuICAgICAgdmFyIG9sZHJhZHMgPSBtZVswXS5yb3RhdGlvbiA9PSB1bmRlZmluZWQgPyAwIDogK21lWzBdLnJvdGF0aW9uLnRvRml4ZWQoMilcbiAgICAgIHZhciBuZXdyYWRzID0gTWF0aC5hdGFuMihkaXN0YW5jZS55LCBkaXN0YW5jZS54KVxuICAgICAgdmFyIGRpcmVjdGlvbiA9IHVuZGVmaW5lZFxuXG4gICAgICB1cGRhdGVEZWJ1Z1RleHQob2xkcmFkcywgbmV3cmFkcylcblxuICAgICAgLy8gYnJlYWtpbmcgdGhlIHNjcmVlbiB1cCBpbnRvIDQgcXVhZHMgdG8gZGV0ZXJtaW5lIGRpcmVjdGlvblxuICAgICAgaWYgKCgob2xkcmFkcyA8PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpID49IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA8PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpID49IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA+PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpID49IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA+PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpID49IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA8PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA8PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA+PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA+PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSkpXG4gICAgICB7XG4gICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlNBTUUgUVVBRCBOQVZcIilcbiAgICAgICAgIGlmIChvbGRyYWRzIDwgbmV3cmFkcykge1xuICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIFdBUzogXCIgKyBkaXJlY3Rpb24pXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRJUkVDVElPTiBOT1c6IGN3XCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXJlY3Rpb24gPSBcImN3XCJcbiAgICAgICAgIH1cbiAgICAgICAgIGlmIChvbGRyYWRzID4gbmV3cmFkcykge1xuICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIFdBUzogXCIgKyBkaXJlY3Rpb24pXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRJUkVDVElPTiBOT1c6IGNjd1wiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlyZWN0aW9uID0gXCJjY3dcIlxuXG4gICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgoKG9sZHJhZHMgPD0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPD0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPj0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPj0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPD0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPj0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPj0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPD0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkpKVxuICAgICAge1xuICAgICAgICAgaWYgKGRpcmVjdGlvbiAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIFdBUzogXCIgKyBkaXJlY3Rpb24pXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRJUkVDVElPTiBOT1c6IGN3XCIpXG4gICAgICAgICB9XG4gICAgICAgICBkaXJlY3Rpb24gPSBcImN3XCJcbiAgICAgIH1cbiAgICAgIGlmICgoKG9sZHJhZHMgPD0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPD0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPj0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPj0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPD0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPj0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkpIHx8XG4gICAgICAgICAoKG9sZHJhZHMgPj0gMCAmJiBNYXRoLmFicyhvbGRyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkgJiYgKG5ld3JhZHMgPD0gMCAmJiBNYXRoLmFicyhuZXdyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkpKVxuICAgICAge1xuICAgICAgICAgaWYgKGRpcmVjdGlvbiAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIFdBUzogXCIgKyBkaXJlY3Rpb24pXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRJUkVDVElPTiBOT1c6IGNjd1wiKVxuICAgICAgICAgfVxuICAgICAgICAgZGlyZWN0aW9uID0gXCJjY3dcIlxuICAgICAgfVxuXG4gICAgICBpZiAoZGlyZWN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgIGNvbnNvbGUubG9nKFwiZGlyZWN0aW9uIGlzIHVuZGVmaW5lZCFcIilcbiAgICAgIH1cblxuICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICBkYXRhVHlwZTogXCJtb3ZlbWVudFwiLFxuICAgICAgICAgY3VyUmFkczogb2xkcmFkcyxcbiAgICAgICAgIG5ld1JhZHM6IG5ld3JhZHMsXG4gICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbixcbiAgICAgICAgIHNwZWVkOiBvdmVyZHJpdmUsXG4gICAgICAgICBjb29yZHM6IGNvb3Jkc1xuICAgICAgfVxuXG4gICAgICBzZW5kVG9TZXJ2ZXIoSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIGNoZWNrRm9vZENvbGxpc2lvbnMgKCkge1xuICAgICAgaWYgKGZvb2QubGVuZ3RoID4gMCkge1xuICAgICAgICAgZm9vZC5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBpZiAoaC5jaXJjbGVDb2xsaXNpb24obWVbMF0sIGl0ZW0pKSB7XG4gICAgICAgICAgICAgICBlYXRGb29kKGl0ZW0pXG4gICAgICAgICAgICB9XG4gICAgICAgICB9KVxuICAgICAgfVxuICAgfVxuXG4gICBmdW5jdGlvbiB1cGRhdGVTY29yZVRleHQgKHNjLCBzaSkge1xuICAgICAgc2NvcmVUZXh0LnRleHQgPSBcIlNjb3JlOiBcIiArIE1hdGgucm91bmQoc2MpICsgXCJcXG5TaXplOiBcIiArIHNpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIGVhdEZvb2QgKGYpIHtcbiAgICAgIHZhciBpbmRleCA9IGZvb2QuaW5kZXhPZihmKVxuICAgICAgc3RhZ2UucmVtb3ZlQ2hpbGQoZilcbiAgICAgIHNjb3JlICs9ICgxMCAqIGYuc2NhbGUueClcbiAgICAgIHVwZGF0ZVNjb3JlVGV4dChzY29yZSwgc3F1aXJtU2l6ZSlcbiAgICAgIGZvb2Quc3BsaWNlKGluZGV4LCAxKVxuICAgICAgY2hlY2tHcm93dGgoKVxuICAgfVxuXG4gICBmdW5jdGlvbiBjaGVja0dyb3d0aCAoKSB7XG4gICAgICB2YXIgbmV3U2l6ZSA9IE1hdGgucm91bmQoc2NvcmUgLyAxMCkgKyAxMFxuICAgICAgaWYgKG5ld1NpemUgPiBzcXVpcm1TaXplKSB7XG4gICAgICAgICB2YXIgZGlmZiA9IG5ld1NpemUgLSBzcXVpcm1TaXplXG4gICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpZmY7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5ld1NlZyA9IG5ldyBQSVhJLlNwcml0ZSh0ZXh0dXJlQm9keSlcbiAgICAgICAgICAgIHZhciBsYXN0ID0gbWUubGVuZ3RoIC0gMVxuICAgICAgICAgICAgbmV3U2VnLmFuY2hvci54ID0gLjVcbiAgICAgICAgICAgIG5ld1NlZy5hbmNob3IueSA9IC41XG4gICAgICAgICAgICBuZXdTZWcucG9zaXRpb24ueCA9IG1lW2xhc3RdLnBvc2l0aW9uLnhcbiAgICAgICAgICAgIG5ld1NlZy5wb3NpdGlvbi55ID0gbWVbbGFzdF0ucG9zaXRpb24ueVxuICAgICAgICAgICAgbmV3U2VnLnNjYWxlLnggPSAuNFxuICAgICAgICAgICAgbmV3U2VnLnNjYWxlLnkgPSAuNFxuICAgICAgICAgICAgbmV3U2VnLnpJbmRleCA9IG5ld1NpemUgKyAxMVxuICAgICAgICAgICAgc3RhZ2UuYWRkQ2hpbGQobmV3U2VnKVxuICAgICAgICAgICAgbWUucHVzaChuZXdTZWcpXG4gICAgICAgICAgICBjb29yZHMucHVzaCh7IHg6IGNvb3Jkc1tsYXN0XS54LCB5OiBjb29yZHNbbGFzdF0ueSB9KVxuICAgICAgICAgfVxuICAgICAgICAgZm9yIChpID0gMDsgaSA8IG1lLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBtZVtpXS56SW5kZXggPSBuZXdTaXplIC0gaSArIDEwXG4gICAgICAgICB9XG4gICAgICAgICBzcXVpcm1TaXplID0gbmV3U2l6ZVxuICAgICAgfVxuICAgfVxuXG4gICBmdW5jdGlvbiBtb3ZlQmcgKHgsIHkpIHtcbiAgICAgIGJnLnBvc2l0aW9uLnggKz0geFxuICAgICAgYmcucG9zaXRpb24ueSArPSB5XG4gICB9XG5cbiAgIGZ1bmN0aW9uIG1vdmVGb29kICh4LCB5KSB7XG4gICAgICBmb29kLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgIGl0ZW0ucG9zaXRpb24ueCArPSB4XG4gICAgICAgICBpdGVtLnBvc2l0aW9uLnkgKz0geVxuICAgICAgfSlcbiAgIH1cblxuICAgZnVuY3Rpb24gYnVpbGRTcXVpcm1lciAoeCx5LHNpemUpIHtcbiAgICAgIHNpemUgPSBzaXplIDwgMSA/IDEgOiBzaXplXG5cbiAgICAgIC8vIHppbmRleCBmb3Igc2NvcmVUZXh0IGlzIDEwMDAwXG4gICAgICAvLyB6aW5kZXggZm9yIGZhY2UgaXMgOTAwMFxuICAgICAgLy8gemluZGV4IGZvciBib2R5IGlzIDEwIHRvIChzaXplICsgMTApXG4gICAgICAvLyB6aW5kZXggZm9yIGZvb2QgaXMgNVxuICAgICAgLy8gemlkbmV4IGZvciBiZyBpcyAxXG4gICAgICB2YXIgemkgPSBzaXplICsgMTBcblxuICAgICAgb2Zmc2V0LnggPSB4IC0gd2luLm1pZC54XG4gICAgICBvZmZzZXQueSA9IHkgLSB3aW4ubWlkLnlcblxuICAgICAgdmFyIGZhY2UgPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZUZhY2UpXG4gICAgICBmYWNlLnBvc2l0aW9uLnggPSB3aW4ubWlkLnhcbiAgICAgIGZhY2UucG9zaXRpb24ueSA9IHdpbi5taWQueVxuICAgICAgZmFjZS5hbmNob3IueCA9IC41XG4gICAgICBmYWNlLmFuY2hvci55ID0gLjVcbiAgICAgIGZhY2Uuc2NhbGUueCA9IC40XG4gICAgICBmYWNlLnNjYWxlLnkgPSAuNFxuICAgICAgZmFjZS56SW5kZXggPSA5MDAwXG5cbiAgICAgIHZhciBib2R5ID0gW11cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICBib2R5W2ldID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmVCb2R5KVxuICAgICAgICAgYm9keVtpXS5hbmNob3IueCA9IC41XG4gICAgICAgICBib2R5W2ldLmFuY2hvci55ID0gLjVcbiAgICAgICAgIGJvZHlbaV0ucG9zaXRpb24ueCA9IGZhY2UucG9zaXRpb24ueFxuICAgICAgICAgYm9keVtpXS5wb3NpdGlvbi55ID0gZmFjZS5wb3NpdGlvbi55XG4gICAgICAgICBib2R5W2ldLnNjYWxlLnggPSAuNFxuICAgICAgICAgYm9keVtpXS5zY2FsZS55ID0gLjRcbiAgICAgICAgIGJvZHlbaV0uekluZGV4ID0gemkgLSBpXG4gICAgICB9XG5cbiAgICAgIG1lWzBdID0gZmFjZVxuICAgICAgYm9keS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICBtZS5wdXNoKGl0ZW0pXG4gICAgICB9KVxuXG4gICAgICB2YXIgYWRkZXIgPSBbXS5jb25jYXQobWUpLnJldmVyc2UoKVxuICAgICAgYWRkZXIuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgc3RhZ2UuYWRkQ2hpbGQoaXRlbSlcbiAgICAgIH0pXG4gICB9XG5cbiAgIGZ1bmN0aW9uIG1ha2VGb29kICgpIHtcbiAgICAgIGlmIChoLmdldFJhbmQoMSwgMTAwKSA+IDk4KSB7XG4gICAgICAgICB2YXIgZlNjYWxlID0gaC5nZXRSYW5kKC4yLCAuNylcbiAgICAgICAgIHZhciBuZXdGb29kID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmVGb29kKVxuICAgICAgICAgbmV3Rm9vZC5hbmNob3IueCA9IC41XG4gICAgICAgICBuZXdGb29kLmFuY2hvci55ID0gLjVcbiAgICAgICAgIG5ld0Zvb2QucG9zaXRpb24ueCA9IGguZ2V0UmFuZCgwLCB3aW4ud2lkdGgpXG4gICAgICAgICBuZXdGb29kLnBvc2l0aW9uLnkgPSBoLmdldFJhbmQoMCwgd2luLmhlaWdodClcbiAgICAgICAgIG5ld0Zvb2Quc2NhbGUueCA9IGZTY2FsZVxuICAgICAgICAgbmV3Rm9vZC5zY2FsZS55ID0gZlNjYWxlXG4gICAgICAgICBuZXdGb29kLnpJbmRleCA9IDVcbiAgICAgICAgIGZvb2QucHVzaChuZXdGb29kKVxuICAgICAgICAgc3RhZ2UuYWRkQ2hpbGQobmV3Rm9vZClcbiAgICAgIH1cbiAgIH1cblxuICAgZnVuY3Rpb24gbG9vcGVyICgpIHtcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wZXIpXG4gICAgICBpZiAod3NPcGVuKSB7XG4gICAgICAgICBtb3ZlbWVudCgpXG4gICAgIC8vICAgIGNoZWNrRm9vZENvbGxpc2lvbnMoKVxuICAgICAvLyAgICBtYWtlRm9vZCgpXG4gICAgICAgICBzdGFnZS51cGRhdGVMYXllcnNPcmRlcigpXG4gICAgICB9XG4gICAgICByZW5kZXJlci5yZW5kZXIoc3RhZ2UpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIHJlc2l6ZSAoKSB7XG4gICAgICBpZiAod2luLndpZHRoICE9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCB8fCB3aW4uaGVpZ2h0ICE9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgIHZhciB4ZGlmZiA9ICh3aW4ud2lkdGggLSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpXG4gICAgICAgICB2YXIgeWRpZmYgPSAod2luLmhlaWdodCAtIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpXG4gICAgICAgICBvZmZzZXQueCArPSAoeGRpZmYgLyAyKVxuICAgICAgICAgb2Zmc2V0LnkgKz0gKHlkaWZmIC8gMilcbiAgICAgICAgIG1vdmVCZygteGRpZmYvMiwteWRpZmYvMilcbiAgICAgICAgIG1vdmVGb29kKC14ZGlmZi8yLC15ZGlmZi8yKVxuICAgICAgICAgd2luID0ge1xuICAgICAgICAgICAgd2lkdGg6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCxcbiAgICAgICAgICAgIG1pZDoge1xuICAgICAgICAgICAgICAgeDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIC8gMixcbiAgICAgICAgICAgICAgIHk6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgLyAyXG4gICAgICAgICAgICB9XG4gICAgICAgICB9XG4gICAgICB9XG4gICAgICByZW5kZXJlci5yZXNpemUod2luLndpZHRoLCB3aW4uaGVpZ2h0KVxuICAgfVxufSkoKSJdfQ==
