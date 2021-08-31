(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyL2NvcmUuanMiLCJicm93c2VyL2hlbHBlci5qcyIsImJyb3dzZXIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwicmVxdWlyZSgnLi9tYWluJylcbiIsInZhciByQW5nbGUgPSA5MCAqIChNYXRoLlBJIC8gMTgwKVxudmFyIHNMaW5lID0gMTgwICogKE1hdGguUEkgLyAxODApXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgZ2V0UmFuZDogZnVuY3Rpb24gKG1pbiwgbWF4KSB7XG4gICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluO1xuICAgfSxcbiAgIGdldE5ld1BvaW50OiBmdW5jdGlvbiAoeCwgeSwgYW5nbGUsIGRpc3RhbmNlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAgeDogKyhNYXRoLmNvcyhhbmdsZSkgKiBkaXN0YW5jZSArIHgpLnRvRml4ZWQoMiksXG4gICAgICAgICB5OiArKE1hdGguc2luKGFuZ2xlKSAqIGRpc3RhbmNlICsgeSkudG9GaXhlZCgyKVxuICAgICAgfVxuICAgfSxcbiAgIHJhZDJkZWc6IGZ1bmN0aW9uIChyYWRzKSB7XG4gICAgICByZXR1cm4gcmFkcyAqICgxODAgLyBNYXRoLlBJKTtcbiAgIH0sXG4gICBkZWcycmFkOiBmdW5jdGlvbiAoZGVnKSB7XG4gICAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApXG4gICB9LFxuICAgcmlnaHRBbmdsZTogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHJBbmdsZVxuICAgfSxcbiAgIHN0ckxpbmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBzTGluZVxuICAgfSxcbiAgIHRlc3RDb2xsaXNpb246IGZ1bmN0aW9uIChyMSwgcjIpIHtcbiAgICAgIHZhciBjb21iaW5lZEhhbGZXaWR0aHMsIGNvbWJpbmVkSGFsZkhlaWdodHMsIHZ4LCB2eTtcblxuICAgICAgcjEuY2VudGVyWCA9IHIxLnBvc2l0aW9uLnggKyByMS53aWR0aCAvIDI7XG4gICAgICByMS5jZW50ZXJZID0gcjEucG9zaXRpb24ueSArIHIxLmhlaWdodCAvIDI7XG4gICAgICByMi5jZW50ZXJYID0gcjIucG9zaXRpb24ueCArIHIyLndpZHRoIC8gMjtcbiAgICAgIHIyLmNlbnRlclkgPSByMi5wb3NpdGlvbi55ICsgcjIuaGVpZ2h0IC8gMjtcblxuICAgICAgcjEuaGFsZldpZHRoID0gcjEud2lkdGggLyAyO1xuICAgICAgcjEuaGFsZkhlaWdodCA9IHIxLmhlaWdodCAvIDI7XG4gICAgICByMi5oYWxmV2lkdGggPSByMi53aWR0aCAvIDI7XG4gICAgICByMi5oYWxmSGVpZ2h0ID0gcjIuaGVpZ2h0IC8gMjtcblxuICAgICAgdnggPSByMS5jZW50ZXJYIC0gcjIuY2VudGVyWDtcbiAgICAgIHZ5ID0gcjEuY2VudGVyWSAtIHIyLmNlbnRlclk7XG5cbiAgICAgIGNvbWJpbmVkSGFsZldpZHRocyA9IHIxLmhhbGZXaWR0aCArIHIyLmhhbGZXaWR0aDtcbiAgICAgIGNvbWJpbmVkSGFsZkhlaWdodHMgPSByMS5oYWxmSGVpZ2h0ICsgcjIuaGFsZkhlaWdodDtcblxuICAgICAgcmV0dXJuIChNYXRoLmFicyh2eCkgPCBjb21iaW5lZEhhbGZXaWR0aHMgJiYgTWF0aC5hYnModnkpIDwgY29tYmluZWRIYWxmSGVpZ2h0cylcbiAgIH0sXG4gICBjaXJjbGVDb2xsaXNpb246IGZ1bmN0aW9uKHIxLCByMikge1xuICAgICAgdmFyIGR4ID0gcjEucG9zaXRpb24ueCAtIHIyLnBvc2l0aW9uLng7XG4gICAgICB2YXIgZHkgPSByMS5wb3NpdGlvbi55IC0gcjIucG9zaXRpb24ueTtcbiAgICAgIHZhciBkaXN0YW5jZSA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG5cbiAgICAgIHJldHVybiAoZGlzdGFuY2UgPCAocjEud2lkdGggLyAyKSArIChyMi53aWR0aCAvIDIpKVxuICAgfVxufSIsIihmdW5jdGlvbiAoKSB7XG4gICB2YXIgaCA9IHJlcXVpcmUoJy4vaGVscGVyJylcbiAgIHZhciB3aW4gPSB7XG4gICAgICB3aWR0aDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoLFxuICAgICAgaGVpZ2h0OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0LFxuICAgICAgbWlkOiB7XG4gICAgICAgICB4OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggLyAyLFxuICAgICAgICAgeTogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCAvIDJcbiAgICAgIH1cbiAgIH1cbiAgIHZhciBvZmZzZXQgPSB7IHg6IDAsIHk6IDAgfVxuICAgdmFyIHJlbmRlcmVyID0gUElYSS5hdXRvRGV0ZWN0UmVuZGVyZXIod2luLndpZHRoLCB3aW4uaGVpZ2h0LHthbnRpYWxpYXM6IHRydWV9KVxuICAgdmFyIHN0YWdlID0gbmV3IFBJWEkuQ29udGFpbmVyKClcbiAgIHZhciB0ZXh0dXJlRmFjZSA9IFBJWEkuVGV4dHVyZS5mcm9tSW1hZ2UoJ2ltYWdlcy9iYXR3b3JtLnBuZycpXG4gICB2YXIgdGV4dHVyZUJvZHkgPSBQSVhJLlRleHR1cmUuZnJvbUltYWdlKCdpbWFnZXMvYmF0Ym9keS5wbmcnKVxuICAgdmFyIHRleHR1cmVGb29kID0gUElYSS5UZXh0dXJlLmZyb21JbWFnZSgnaW1hZ2VzL2NpcmNsZTIucG5nJylcbiAgLy8gdmFyIGNoID0gbmV3IFBJWEkuU3ByaXRlKFBJWEkuVGV4dHVyZS5mcm9tSW1hZ2UoJ2ltYWdlcy9jcm9zc2hhaXIucG5nJykpXG4gICB2YXIgYmcgPSBuZXcgUElYSS5TcHJpdGUoUElYSS5UZXh0dXJlLmZyb21JbWFnZSgnaW1hZ2VzL2JnLmpwZycpKVxuICAgdmFyIHNjb3JlID0gMFxuICAgdmFyIHNxdWlybVNpemUgPSAwXG4gICB2YXIgc2NvcmVTdHlsZSA9IHsgZm9udEZhbWlseTogXCJBcmlhbFwiLCBmb250U2l6ZTogMTgsIGZpbGw6IFwid2hpdGVcIiwgc3Ryb2tlOiBcImJsYWNrXCIsIHN0cm9rZVRoaWNrbmVzczogNCB9XG4gICB2YXIgc2NvcmVUZXh0ID0gbmV3IFBJWEkuVGV4dChcIlNjb3JlOiBcIiArIHNjb3JlICsgXCJcXG5TaXplOiBcIiArIHNxdWlybVNpemUsIHNjb3JlU3R5bGUpXG4gICB2YXIgZGVidWdTdHlsZSA9IHsgZm9udEZhbWlseTogXCJBcmlhbFwiLCBmb250U2l6ZTogMTgsIGZpbGw6IFwid2hpdGVcIiwgc3Ryb2tlOiBcImJsYWNrXCIsIHN0cm9rZVRoaWNrbmVzczogNCB9XG4gICB2YXIgZGVidWdUZXh0ID0gbmV3IFBJWEkuVGV4dChcIm9sZHJhZHM6IFwiICsgMCArIFwiXFxubmV3cmFkczogXCIgKyAwLCBkZWJ1Z1N0eWxlKVxuICAgdmFyIG1lID0gW11cbiAgIHZhciBvdGhlcnMgPSBbXVxuICAgdmFyIG90aGVyc0Nvb3JkcyA9IFtdXG4gICB2YXIgbnVtT2ZQbGF5ZXJzID0gMVxuICAgdmFyIGNvb3JkcyA9IFtdXG4gICB2YXIgZm9vZCA9IFtdXG4gICB2YXIgbW91c2UgPSByZW5kZXJlci5wbHVnaW5zLmludGVyYWN0aW9uLmV2ZW50RGF0YS5kYXRhLmdsb2JhbFxuICAgdmFyIGJhc2VTcGVlZCA9IDNcbiAgIHZhciBvdmVyZHJpdmUgPSAxXG4gICB2YXIgd3NPcGVuID0gZmFsc2VcbiAgIHZhciBwbGF5ZXJOdW0gPSAwXG5cbiAgIHZhciBIT1NUID0gbG9jYXRpb24ub3JpZ2luLnJlcGxhY2UoL15odHRwLywgJ3dzJylcbiAgIHZhciB3cyA9IG5ldyBXZWJTb2NrZXQoSE9TVCk7XG5cbiAvLyAgdmFyIGhvc3QgPSBsb2NhdGlvbi5vcmlnaW4ucmVwbGFjZSgvOi4qLywgJycpXG4gLy8gIHZhciB3cyA9IG5ldyBXZWJTb2NrZXQoJ3dzOi8vJyArIGhvc3QgKyAnOjgwODAnKVxuXG4gICB3cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGNoZWNrTXNnKGV2ZW50LmRhdGEpXG4gICB9O1xuXG4gICB3cy5vbm9wZW4gPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIHdzT3BlbiA9IHRydWVcblxuICAgfTtcblxuICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyZW5kZXJlci52aWV3KVxuXG4gICB3aW5kb3cub25yZXNpemUgPSByZXNpemVcblxuICAgc3RhZ2UudXBkYXRlTGF5ZXJzT3JkZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBzdGFnZS5jaGlsZHJlbi5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICBhLnpJbmRleCA9IGEuekluZGV4IHx8IDBcbiAgICAgICAgIGIuekluZGV4ID0gYi56SW5kZXggfHwgMFxuICAgICAgICAgcmV0dXJuIGEuekluZGV4IC0gYi56SW5kZXhcbiAgICAgIH0pXG4gICB9XG5cbiAgIGZ1bmN0aW9uIGluaXQgKHgseSxzaXplKSB7XG5cbiAgICAgIGlmIChyZW5kZXJlci50eXBlID09PSBQSVhJLlJFTkRFUkVSX1RZUEUuV0VCR0wpIHtcbiAgICAgICAgIGNvbnNvbGUubG9nKCdVc2luZyBXZWJHTCcpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgY29uc29sZS5sb2coJ1VzaW5nIENhbnZhcycpXG4gICAgICB9XG5cbiAgICAgIHNldEJhY2tncm91bmQoeCx5KVxuICAgICAgc2V0U2NvcmUoKVxuICAgICAgc2V0RGVidWcoKVxuICAgICAgYnVpbGRTcXVpcm1lcih4LHksc2l6ZSlcbiAgICAgIGxvb3BlcigpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIHNldEJhY2tncm91bmQgKHgseSkge1xuICAgICAgYmcucG9zaXRpb24ueCA9IHhcbiAgICAgIGJnLnBvc2l0aW9uLnkgPSB5XG4gICAgICBiZy5hbmNob3IueCA9IC41XG4gICAgICBiZy5hbmNob3IueSA9IC41XG4gICAgICBiZy56SW5kZXggPSAxXG4gICAgICBiZy5pbnRlcmFjdGl2ZSA9IHRydWVcbiAgICAgIGJnLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICBvdmVyZHJpdmUgPSAyXG4gICAgICB9KVxuICAgICAgYmcub24oJ21vdXNldXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICBvdmVyZHJpdmUgPSAxXG4gICAgICB9KVxuXG4gICAgICBzdGFnZS5hZGRDaGlsZChiZylcblxuICAvKlxuICAgICAgY2gucG9zaXRpb24ueCA9IHdpbi5taWQueFxuICAgICAgY2gucG9zaXRpb24ueSA9IHdpbi5taWQueVxuICAgICAgY2guYW5jaG9yLnggPSAuNVxuICAgICAgY2guYW5jaG9yLnkgPSAuNVxuICAgICAgY2guekluZGV4ID0gMTAwMDBcbiAgICAgIHN0YWdlLmFkZENoaWxkKGNoKVxuICAgICAgKi9cbiAgIH1cblxuICAgZnVuY3Rpb24gc2V0U2NvcmUgKCkge1xuICAgICAgc2NvcmVUZXh0LnBvc2l0aW9uLnggPSAwXG4gICAgICBzY29yZVRleHQucG9zaXRpb24ueSA9IHdpbi5oZWlnaHRcbiAgICAgIHNjb3JlVGV4dC5hbmNob3IueCA9IDBcbiAgICAgIHNjb3JlVGV4dC5hbmNob3IueSA9IDFcbiAgICAgIHNjb3JlVGV4dC56SW5kZXggPSAxMDAwMFxuICAgICAgc3RhZ2UuYWRkQ2hpbGQoc2NvcmVUZXh0KVxuICAgfVxuXG4gICBmdW5jdGlvbiBzZXREZWJ1ZyAoKSB7XG4gICAgICBkZWJ1Z1RleHQucG9zaXRpb24ueCA9IHdpbi53aWR0aFxuICAgICAgZGVidWdUZXh0LnBvc2l0aW9uLnkgPSB3aW4uaGVpZ2h0XG4gICAgICBkZWJ1Z1RleHQuYW5jaG9yLnggPSAxXG4gICAgICBkZWJ1Z1RleHQuYW5jaG9yLnkgPSAxXG4gICAgICBkZWJ1Z1RleHQuekluZGV4ID0gMTAwMDBcbiAgICAgIHN0YWdlLmFkZENoaWxkKGRlYnVnVGV4dClcbiAgIH1cblxuICAgZnVuY3Rpb24gdXBkYXRlRGVidWdUZXh0IChvLCBuKSB7XG4gICAgICBkZWJ1Z1RleHQudGV4dCA9IFwib2xkcmFkczogXCIgKyBvLnRvRml4ZWQoMikgKyBcIlxcbm5ld3JhZHM6IFwiICsgbi50b0ZpeGVkKDIpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIHNlbmRUb1NlcnZlcihkYXRhKSB7XG4gICAgICB3cy5zZW5kKGRhdGEsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgY29uc29sZS5sb2coXCJFUlJPUlwiKVxuICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgfSlcbiAgIH1cblxuICAgZnVuY3Rpb24gY2hlY2tNc2cgKGRhdGEpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKVxuICAgICAgfVxuICAgICAgY2F0Y2goZSkge1xuICAgICAgICAgY29uc29sZS5sb2coZSlcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuZGF0YVR5cGUgPT0gXCJpbml0Y29uXCIpIHtcbiAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgICBwbGF5ZXJOdW0gPSBkYXRhLnBsYXllck51bVxuICAgICAgICAgc3F1aXJtU2l6ZSA9IGRhdGEuc2l6ZVxuICAgICAgICAgY29vcmRzID0gZGF0YS5jb29yZHNcbiAgICAgICAgIGluaXQoY29vcmRzWzBdLngsIGNvb3Jkc1swXS55LCBzcXVpcm1TaXplKVxuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5kYXRhVHlwZSA9PSBcIm1vdmVtZW50XCIpIHtcbiAgICAgICAgIHZhciBtZWNvb3JkcyA9IFtdXG4gICAgICAgICB2YXIgcGxheWVycyA9IFtdXG5cbiAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5hbGwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmFsbFtpXS5wbGF5ZXJOdW0gPT0gcGxheWVyTnVtKSB7XG4gICAgICAgICAgICAgICBtZWNvb3JkcyA9IGRhdGEuYWxsW2ldLmNvb3Jkc1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICBwbGF5ZXJzLnB1c2goZGF0YS5hbGxbaV0pXG4gICAgICAgICAgICB9XG4gICAgICAgICB9XG5cbiAgICAgICAgIHZhciB0b2Zmc2V0ID0ge1xuICAgICAgICAgICAgeDogY29vcmRzWzBdLnggLSBtZWNvb3Jkc1swXS54LFxuICAgICAgICAgICAgeTogY29vcmRzWzBdLnkgLSBtZWNvb3Jkc1swXS55XG4gICAgICAgICB9XG5cbiAgICAgICAgIG9mZnNldC54IC09IHRvZmZzZXQueFxuICAgICAgICAgb2Zmc2V0LnkgLT0gdG9mZnNldC55XG5cbiAgICAgICAgIG1vdmVCZyh0b2Zmc2V0LngsIHRvZmZzZXQueSlcbiAgICAgICAgIG1vdmVGb29kKHRvZmZzZXQueCwgdG9mZnNldC55KVxuICAgICAgICAgY29vcmRzID0gbWVjb29yZHNcblxuICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbWVbaV0ucm90YXRpb24gPSBjb29yZHNbaV0ucm90YXRpb25cbiAgICAgICAgICAgIG1lW2ldLnBvc2l0aW9uLnggPSBjb29yZHNbaV0ueCAtIG9mZnNldC54XG4gICAgICAgICAgICBtZVtpXS5wb3NpdGlvbi55ID0gY29vcmRzW2ldLnkgLSBvZmZzZXQueVxuICAgICAgICAgfVxuICAgICAgICAgY2hlY2tPdGhlcnMocGxheWVycylcbiAgICAgIH1cbiAgIH1cblxuICAgZnVuY3Rpb24gY2hlY2tPdGhlcnMocGxheWVycykge1xuICAgICAgdmFyIGFscmVhZHlFeGlzdHNcbiAgICAgIG90aGVyc0Nvb3JkcyA9IHBsYXllcnNcbiAgICAgIGlmIChvdGhlcnNDb29yZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvdGhlcnNDb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFscmVhZHlFeGlzdHMgPSBmYWxzZVxuICAgICAgICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IG90aGVycy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgIGlmIChvdGhlcnNDb29yZHNbaV0ucGxheWVyTnVtID09IG90aGVyc1tpaV0ucGxheWVyTnVtKSB7XG4gICAgICAgICAgICAgICAgICBhbHJlYWR5RXhpc3RzID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgbW92ZU90aGVyKGlpLG90aGVyc0Nvb3Jkc1tpXSlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghYWxyZWFkeUV4aXN0cykge1xuICAgICAgICAgICAgICAgdmFyIHNpemUgPSBvdGhlcnNDb29yZHNbaV0uY29vcmRzLmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgIGNyZWF0ZU90aGVyKG90aGVyc0Nvb3Jkc1tpXSwgc2l6ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBub3RQbGF5aW5nXG4gICAgICBpZiAob3RoZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBvdGhlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5vdFBsYXlpbmcgPSB0cnVlXG4gICAgICAgICAgICBmb3IgKGlpID0gMDsgaWkgPCBvdGhlcnNDb29yZHMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICBpZiAob3RoZXJzW2ldLnBsYXllck51bSA9PSBvdGhlcnNDb29yZHNbaWldLnBsYXllck51bSkge1xuICAgICAgICAgICAgICAgICAgbm90UGxheWluZyA9IGZhbHNlXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm90UGxheWluZykge1xuICAgICAgICAgICAgICAgZm9yICh2YXIgYSA9IDA7IGEgPCBvdGhlcnNbaV0ubGVuZ3RoOyBhKyspIHtcbiAgICAgICAgICAgICAgICAgIHN0YWdlLnJlbW92ZUNoaWxkKG90aGVyc1tpXVthXSlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIG90aGVycy5zcGxpY2UoaSwxKVxuICAgICAgICAgICAgfVxuICAgICAgICAgfVxuICAgICAgfVxuICAgfVxuXG4gICBmdW5jdGlvbiBtb3ZlT3RoZXIob2luZGV4LGNvb3Jkcykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvdGhlcnNbb2luZGV4XS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgb3RoZXJzW29pbmRleF1baV0ucm90YXRpb24gPSBjb29yZHMuY29vcmRzW2ldLnJvdGF0aW9uXG4gICAgICAgICBvdGhlcnNbb2luZGV4XVtpXS5wb3NpdGlvbi54ID0gY29vcmRzLmNvb3Jkc1tpXS54IC0gb2Zmc2V0LnhcbiAgICAgICAgIG90aGVyc1tvaW5kZXhdW2ldLnBvc2l0aW9uLnkgPSBjb29yZHMuY29vcmRzW2ldLnkgLSBvZmZzZXQueVxuICAgICAgfVxuICAgfVxuXG4gICBmdW5jdGlvbiBjcmVhdGVPdGhlcihvdGhlcixzaXplKSB7XG4gICAgICB2YXIgemkgPSBzaXplICsgMTBcbiAgICAgIHZhciBmYWNlID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmVGYWNlKVxuICAgICAgZmFjZS5wb3NpdGlvbi54ID0gb3RoZXIuY29vcmRzWzBdLnggLSBvZmZzZXQueFxuICAgICAgZmFjZS5wb3NpdGlvbi55ID0gb3RoZXIuY29vcmRzWzBdLnkgLSBvZmZzZXQueVxuICAgICAgZmFjZS5hbmNob3IueCA9IC41XG4gICAgICBmYWNlLmFuY2hvci55ID0gLjVcbiAgICAgIGZhY2Uuc2NhbGUueCA9IC40XG4gICAgICBmYWNlLnNjYWxlLnkgPSAuNFxuICAgICAgZmFjZS56SW5kZXggPSA5MDAwXG5cbiAgICAgIHZhciBib2R5ID0gW11cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICBib2R5W2ldID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmVCb2R5KVxuICAgICAgICAgYm9keVtpXS5hbmNob3IueCA9IC41XG4gICAgICAgICBib2R5W2ldLmFuY2hvci55ID0gLjVcbiAgICAgICAgIGJvZHlbaV0ucG9zaXRpb24ueCA9IG90aGVyLmNvb3Jkc1tpKzFdLnggLSBvZmZzZXQueFxuICAgICAgICAgYm9keVtpXS5wb3NpdGlvbi55ID0gb3RoZXIuY29vcmRzW2krMV0ueSAtIG9mZnNldC55XG4gICAgICAgICBib2R5W2ldLnNjYWxlLnggPSAuNFxuICAgICAgICAgYm9keVtpXS5zY2FsZS55ID0gLjRcbiAgICAgICAgIGJvZHlbaV0uekluZGV4ID0gemkgLSBpXG4gICAgICB9XG5cbiAgICAgIHZhciBpbmRleCA9IG90aGVycy5sZW5ndGhcbiAgICAgICAgIG90aGVyc1tpbmRleF0gPSBbXVxuXG4gICAgICBvdGhlcnNbaW5kZXhdWzBdID0gZmFjZVxuICAgICAgYm9keS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICBvdGhlcnNbaW5kZXhdLnB1c2goaXRlbSlcbiAgICAgIH0pXG5cbiAgICAgIG90aGVyc1tpbmRleF0ucGxheWVyTnVtID0gb3RoZXIucGxheWVyTnVtXG5cbiAgICAgIHZhciBhZGRlciA9IFtdLmNvbmNhdChvdGhlcnNbaW5kZXhdKS5yZXZlcnNlKClcbiAgICAgIGFkZGVyLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgIHN0YWdlLmFkZENoaWxkKGl0ZW0pXG4gICAgICB9KVxuICAgfVxuXG4gICBmdW5jdGlvbiBtb3ZlbWVudCgpIHtcbiAgICAgIHZhciBzcGVlZCA9IGJhc2VTcGVlZCAqIG92ZXJkcml2ZVxuICAgICAgdmFyIGRpc3RhbmNlID0ge1xuICAgICAgICAgdG90YWw6IDAsXG4gICAgICAgICB4OiAwLFxuICAgICAgICAgeTogMFxuICAgICAgfVxuICAgICAgZGlzdGFuY2UueCA9IG1vdXNlLnggLSB3aW4ubWlkLnhcbiAgICAgIGRpc3RhbmNlLnkgPSBtb3VzZS55IC0gd2luLm1pZC55XG4gICAgICB2YXIgb2xkcmFkcyA9IG1lWzBdLnJvdGF0aW9uID09IHVuZGVmaW5lZCA/IDAgOiArbWVbMF0ucm90YXRpb24udG9GaXhlZCgyKVxuICAgICAgdmFyIG5ld3JhZHMgPSBNYXRoLmF0YW4yKGRpc3RhbmNlLnksIGRpc3RhbmNlLngpXG4gICAgICB2YXIgZGlyZWN0aW9uID0gdW5kZWZpbmVkXG5cbiAgICAgIHVwZGF0ZURlYnVnVGV4dChvbGRyYWRzLCBuZXdyYWRzKVxuXG4gICAgICAvLyBicmVha2luZyB0aGUgc2NyZWVuIHVwIGludG8gNCBxdWFkcyB0byBkZXRlcm1pbmUgZGlyZWN0aW9uXG4gICAgICBpZiAoKChvbGRyYWRzIDw9IDAgJiYgTWF0aC5hYnMob2xkcmFkcykgPj0gaC5yaWdodEFuZ2xlKCkpICYmIChuZXdyYWRzIDw9IDAgJiYgTWF0aC5hYnMobmV3cmFkcykgPj0gaC5yaWdodEFuZ2xlKCkpKSB8fFxuICAgICAgICAgKChvbGRyYWRzID49IDAgJiYgTWF0aC5hYnMob2xkcmFkcykgPj0gaC5yaWdodEFuZ2xlKCkpICYmIChuZXdyYWRzID49IDAgJiYgTWF0aC5hYnMobmV3cmFkcykgPj0gaC5yaWdodEFuZ2xlKCkpKSB8fFxuICAgICAgICAgKChvbGRyYWRzIDw9IDAgJiYgTWF0aC5hYnMob2xkcmFkcykgPD0gaC5yaWdodEFuZ2xlKCkpICYmIChuZXdyYWRzIDw9IDAgJiYgTWF0aC5hYnMobmV3cmFkcykgPD0gaC5yaWdodEFuZ2xlKCkpKSB8fFxuICAgICAgICAgKChvbGRyYWRzID49IDAgJiYgTWF0aC5hYnMob2xkcmFkcykgPD0gaC5yaWdodEFuZ2xlKCkpICYmIChuZXdyYWRzID49IDAgJiYgTWF0aC5hYnMobmV3cmFkcykgPD0gaC5yaWdodEFuZ2xlKCkpKSlcbiAgICAgIHtcbiAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiU0FNRSBRVUFEIE5BVlwiKVxuICAgICAgICAgaWYgKG9sZHJhZHMgPCBuZXdyYWRzKSB7XG4gICAgICAgICAgICBpZiAoZGlyZWN0aW9uICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJESVJFQ1RJT04gV0FTOiBcIiArIGRpcmVjdGlvbilcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIE5PVzogY3dcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpcmVjdGlvbiA9IFwiY3dcIlxuICAgICAgICAgfVxuICAgICAgICAgaWYgKG9sZHJhZHMgPiBuZXdyYWRzKSB7XG4gICAgICAgICAgICBpZiAoZGlyZWN0aW9uICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJESVJFQ1RJT04gV0FTOiBcIiArIGRpcmVjdGlvbilcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIE5PVzogY2N3XCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXJlY3Rpb24gPSBcImNjd1wiXG5cbiAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCgob2xkcmFkcyA8PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpID49IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA8PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA+PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpID49IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA+PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA8PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA+PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA+PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpID49IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA8PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpID49IGgucmlnaHRBbmdsZSgpKSkpXG4gICAgICB7XG4gICAgICAgICBpZiAoZGlyZWN0aW9uICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJESVJFQ1RJT04gV0FTOiBcIiArIGRpcmVjdGlvbilcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIE5PVzogY3dcIilcbiAgICAgICAgIH1cbiAgICAgICAgIGRpcmVjdGlvbiA9IFwiY3dcIlxuICAgICAgfVxuICAgICAgaWYgKCgob2xkcmFkcyA8PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA8PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpID49IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA+PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA+PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpID49IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA8PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpID49IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA+PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpID49IGgucmlnaHRBbmdsZSgpKSkgfHxcbiAgICAgICAgICgob2xkcmFkcyA+PSAwICYmIE1hdGguYWJzKG9sZHJhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSAmJiAobmV3cmFkcyA8PSAwICYmIE1hdGguYWJzKG5ld3JhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSkpXG4gICAgICB7XG4gICAgICAgICBpZiAoZGlyZWN0aW9uICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJESVJFQ1RJT04gV0FTOiBcIiArIGRpcmVjdGlvbilcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIE5PVzogY2N3XCIpXG4gICAgICAgICB9XG4gICAgICAgICBkaXJlY3Rpb24gPSBcImNjd1wiXG4gICAgICB9XG5cbiAgICAgIGlmIChkaXJlY3Rpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgY29uc29sZS5sb2coXCJkaXJlY3Rpb24gaXMgdW5kZWZpbmVkIVwiKVxuICAgICAgfVxuXG4gICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgIGRhdGFUeXBlOiBcIm1vdmVtZW50XCIsXG4gICAgICAgICBjdXJSYWRzOiBvbGRyYWRzLFxuICAgICAgICAgbmV3UmFkczogbmV3cmFkcyxcbiAgICAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLFxuICAgICAgICAgc3BlZWQ6IG92ZXJkcml2ZSxcbiAgICAgICAgIGNvb3JkczogY29vcmRzXG4gICAgICB9XG5cbiAgICAgIHNlbmRUb1NlcnZlcihKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgIH1cblxuICAgZnVuY3Rpb24gY2hlY2tGb29kQ29sbGlzaW9ucyAoKSB7XG4gICAgICBpZiAoZm9vZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICBmb29kLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIGlmIChoLmNpcmNsZUNvbGxpc2lvbihtZVswXSwgaXRlbSkpIHtcbiAgICAgICAgICAgICAgIGVhdEZvb2QoaXRlbSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH0pXG4gICAgICB9XG4gICB9XG5cbiAgIGZ1bmN0aW9uIHVwZGF0ZVNjb3JlVGV4dCAoc2MsIHNpKSB7XG4gICAgICBzY29yZVRleHQudGV4dCA9IFwiU2NvcmU6IFwiICsgTWF0aC5yb3VuZChzYykgKyBcIlxcblNpemU6IFwiICsgc2lcbiAgIH1cblxuICAgZnVuY3Rpb24gZWF0Rm9vZCAoZikge1xuICAgICAgdmFyIGluZGV4ID0gZm9vZC5pbmRleE9mKGYpXG4gICAgICBzdGFnZS5yZW1vdmVDaGlsZChmKVxuICAgICAgc2NvcmUgKz0gKDEwICogZi5zY2FsZS54KVxuICAgICAgdXBkYXRlU2NvcmVUZXh0KHNjb3JlLCBzcXVpcm1TaXplKVxuICAgICAgZm9vZC5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICBjaGVja0dyb3d0aCgpXG4gICB9XG5cbiAgIGZ1bmN0aW9uIGNoZWNrR3Jvd3RoICgpIHtcbiAgICAgIHZhciBuZXdTaXplID0gTWF0aC5yb3VuZChzY29yZSAvIDEwKSArIDEwXG4gICAgICBpZiAobmV3U2l6ZSA+IHNxdWlybVNpemUpIHtcbiAgICAgICAgIHZhciBkaWZmID0gbmV3U2l6ZSAtIHNxdWlybVNpemVcbiAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlmZjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbmV3U2VnID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmVCb2R5KVxuICAgICAgICAgICAgdmFyIGxhc3QgPSBtZS5sZW5ndGggLSAxXG4gICAgICAgICAgICBuZXdTZWcuYW5jaG9yLnggPSAuNVxuICAgICAgICAgICAgbmV3U2VnLmFuY2hvci55ID0gLjVcbiAgICAgICAgICAgIG5ld1NlZy5wb3NpdGlvbi54ID0gbWVbbGFzdF0ucG9zaXRpb24ueFxuICAgICAgICAgICAgbmV3U2VnLnBvc2l0aW9uLnkgPSBtZVtsYXN0XS5wb3NpdGlvbi55XG4gICAgICAgICAgICBuZXdTZWcuc2NhbGUueCA9IC40XG4gICAgICAgICAgICBuZXdTZWcuc2NhbGUueSA9IC40XG4gICAgICAgICAgICBuZXdTZWcuekluZGV4ID0gbmV3U2l6ZSArIDExXG4gICAgICAgICAgICBzdGFnZS5hZGRDaGlsZChuZXdTZWcpXG4gICAgICAgICAgICBtZS5wdXNoKG5ld1NlZylcbiAgICAgICAgICAgIGNvb3Jkcy5wdXNoKHsgeDogY29vcmRzW2xhc3RdLngsIHk6IGNvb3Jkc1tsYXN0XS55IH0pXG4gICAgICAgICB9XG4gICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG1lW2ldLnpJbmRleCA9IG5ld1NpemUgLSBpICsgMTBcbiAgICAgICAgIH1cbiAgICAgICAgIHNxdWlybVNpemUgPSBuZXdTaXplXG4gICAgICB9XG4gICB9XG5cbiAgIGZ1bmN0aW9uIG1vdmVCZyAoeCwgeSkge1xuICAgICAgYmcucG9zaXRpb24ueCArPSB4XG4gICAgICBiZy5wb3NpdGlvbi55ICs9IHlcbiAgIH1cblxuICAgZnVuY3Rpb24gbW92ZUZvb2QgKHgsIHkpIHtcbiAgICAgIGZvb2QuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgaXRlbS5wb3NpdGlvbi54ICs9IHhcbiAgICAgICAgIGl0ZW0ucG9zaXRpb24ueSArPSB5XG4gICAgICB9KVxuICAgfVxuXG4gICBmdW5jdGlvbiBidWlsZFNxdWlybWVyICh4LHksc2l6ZSkge1xuICAgICAgc2l6ZSA9IHNpemUgPCAxID8gMSA6IHNpemVcblxuICAgICAgLy8gemluZGV4IGZvciBzY29yZVRleHQgaXMgMTAwMDBcbiAgICAgIC8vIHppbmRleCBmb3IgZmFjZSBpcyA5MDAwXG4gICAgICAvLyB6aW5kZXggZm9yIGJvZHkgaXMgMTAgdG8gKHNpemUgKyAxMClcbiAgICAgIC8vIHppbmRleCBmb3IgZm9vZCBpcyA1XG4gICAgICAvLyB6aWRuZXggZm9yIGJnIGlzIDFcbiAgICAgIHZhciB6aSA9IHNpemUgKyAxMFxuXG4gICAgICBvZmZzZXQueCA9IHggLSB3aW4ubWlkLnhcbiAgICAgIG9mZnNldC55ID0geSAtIHdpbi5taWQueVxuXG4gICAgICB2YXIgZmFjZSA9IG5ldyBQSVhJLlNwcml0ZSh0ZXh0dXJlRmFjZSlcbiAgICAgIGZhY2UucG9zaXRpb24ueCA9IHdpbi5taWQueFxuICAgICAgZmFjZS5wb3NpdGlvbi55ID0gd2luLm1pZC55XG4gICAgICBmYWNlLmFuY2hvci54ID0gLjVcbiAgICAgIGZhY2UuYW5jaG9yLnkgPSAuNVxuICAgICAgZmFjZS5zY2FsZS54ID0gLjRcbiAgICAgIGZhY2Uuc2NhbGUueSA9IC40XG4gICAgICBmYWNlLnpJbmRleCA9IDkwMDBcblxuICAgICAgdmFyIGJvZHkgPSBbXVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgIGJvZHlbaV0gPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZUJvZHkpXG4gICAgICAgICBib2R5W2ldLmFuY2hvci54ID0gLjVcbiAgICAgICAgIGJvZHlbaV0uYW5jaG9yLnkgPSAuNVxuICAgICAgICAgYm9keVtpXS5wb3NpdGlvbi54ID0gZmFjZS5wb3NpdGlvbi54XG4gICAgICAgICBib2R5W2ldLnBvc2l0aW9uLnkgPSBmYWNlLnBvc2l0aW9uLnlcbiAgICAgICAgIGJvZHlbaV0uc2NhbGUueCA9IC40XG4gICAgICAgICBib2R5W2ldLnNjYWxlLnkgPSAuNFxuICAgICAgICAgYm9keVtpXS56SW5kZXggPSB6aSAtIGlcbiAgICAgIH1cblxuICAgICAgbWVbMF0gPSBmYWNlXG4gICAgICBib2R5LmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgIG1lLnB1c2goaXRlbSlcbiAgICAgIH0pXG5cbiAgICAgIHZhciBhZGRlciA9IFtdLmNvbmNhdChtZSkucmV2ZXJzZSgpXG4gICAgICBhZGRlci5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICBzdGFnZS5hZGRDaGlsZChpdGVtKVxuICAgICAgfSlcbiAgIH1cblxuICAgZnVuY3Rpb24gbWFrZUZvb2QgKCkge1xuICAgICAgaWYgKGguZ2V0UmFuZCgxLCAxMDApID4gOTgpIHtcbiAgICAgICAgIHZhciBmU2NhbGUgPSBoLmdldFJhbmQoLjIsIC43KVxuICAgICAgICAgdmFyIG5ld0Zvb2QgPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZUZvb2QpXG4gICAgICAgICBuZXdGb29kLmFuY2hvci54ID0gLjVcbiAgICAgICAgIG5ld0Zvb2QuYW5jaG9yLnkgPSAuNVxuICAgICAgICAgbmV3Rm9vZC5wb3NpdGlvbi54ID0gaC5nZXRSYW5kKDAsIHdpbi53aWR0aClcbiAgICAgICAgIG5ld0Zvb2QucG9zaXRpb24ueSA9IGguZ2V0UmFuZCgwLCB3aW4uaGVpZ2h0KVxuICAgICAgICAgbmV3Rm9vZC5zY2FsZS54ID0gZlNjYWxlXG4gICAgICAgICBuZXdGb29kLnNjYWxlLnkgPSBmU2NhbGVcbiAgICAgICAgIG5ld0Zvb2QuekluZGV4ID0gNVxuICAgICAgICAgZm9vZC5wdXNoKG5ld0Zvb2QpXG4gICAgICAgICBzdGFnZS5hZGRDaGlsZChuZXdGb29kKVxuICAgICAgfVxuICAgfVxuXG4gICBmdW5jdGlvbiBsb29wZXIgKCkge1xuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3BlcilcbiAgICAgIGlmICh3c09wZW4pIHtcbiAgICAgICAgIG1vdmVtZW50KClcbiAgICAgLy8gICAgY2hlY2tGb29kQ29sbGlzaW9ucygpXG4gICAgIC8vICAgIG1ha2VGb29kKClcbiAgICAgICAgIHN0YWdlLnVwZGF0ZUxheWVyc09yZGVyKClcbiAgICAgIH1cbiAgICAgIHJlbmRlcmVyLnJlbmRlcihzdGFnZSlcbiAgIH1cblxuICAgZnVuY3Rpb24gcmVzaXplICgpIHtcbiAgICAgIGlmICh3aW4ud2lkdGggIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIHx8IHdpbi5oZWlnaHQgIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgICAgdmFyIHhkaWZmID0gKHdpbi53aWR0aCAtIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aClcbiAgICAgICAgIHZhciB5ZGlmZiA9ICh3aW4uaGVpZ2h0IC0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodClcbiAgICAgICAgIG9mZnNldC54ICs9ICh4ZGlmZiAvIDIpXG4gICAgICAgICBvZmZzZXQueSArPSAoeWRpZmYgLyAyKVxuICAgICAgICAgbW92ZUJnKC14ZGlmZi8yLC15ZGlmZi8yKVxuICAgICAgICAgbW92ZUZvb2QoLXhkaWZmLzIsLXlkaWZmLzIpXG4gICAgICAgICB3aW4gPSB7XG4gICAgICAgICAgICB3aWR0aDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0LFxuICAgICAgICAgICAgbWlkOiB7XG4gICAgICAgICAgICAgICB4OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggLyAyLFxuICAgICAgICAgICAgICAgeTogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCAvIDJcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlbmRlcmVyLnJlc2l6ZSh3aW4ud2lkdGgsIHdpbi5oZWlnaHQpXG4gICB9XG59KSgpIl19
