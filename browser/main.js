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