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
  const h = require("./helper");
  const win = {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
    mid: {
      x: document.documentElement.clientWidth / 2,
      y: document.documentElement.clientHeight / 2,
    },
  };
  const offset = { x: 0, y: 0 };
  const app = new PIXI.Application({
    width: win.width,
    height: win.height,
    antialias: true,
  });
  var textureFace = PIXI.Texture.from("images/batworm.png");
  var textureBody = PIXI.Texture.from("images/batbody.png");
  var textureFood = PIXI.Texture.from("images/circle2.png");
  // var ch = new PIXI.Sprite(PIXI.Texture.from('images/crosshair.png'))
  var bg = new PIXI.Sprite(PIXI.Texture.from("images/bg.jpg"));
  var score = 0;
  var squirmSize = 0;
  var scoreStyle = {
    fontFamily: "Arial",
    fontSize: 18,
    fill: "white",
    stroke: "black",
    strokeThickness: 4,
  };
  var scoreText = new PIXI.Text(
    "Score: " + score + "\nSize: " + squirmSize,
    scoreStyle
  );
  var debugStyle = {
    fontFamily: "Arial",
    fontSize: 18,
    fill: "white",
    stroke: "black",
    strokeThickness: 4,
  };
  var debugText = new PIXI.Text(
    "oldrads: " + 0 + "\nnewrads: " + 0,
    debugStyle
  );
  var me = [];
  var others = [];
  var othersCoords = [];
  var numOfPlayers = 1;
  var coords = [];
  var food = [];
  var mouse = app.renderer.plugins.interaction.mouse.global;
  var baseSpeed = 3;
  var overdrive = 1;
  var wsOpen = false;
  var playerNum = 0;

  var HOST = location.origin.replace(/^http/, "ws");
  var ws = new WebSocket(HOST);

  //  var host = location.origin.replace(/:.*/, '')
  //  var ws = new WebSocket('ws://' + host + ':8080')

  ws.onmessage = function (event) {
    checkMsg(event.data);
  };

  ws.onopen = function (event) {
    wsOpen = true;
  };

  document.body.appendChild(app.renderer.view);

  window.onresize = resize;

  app.stage.updateLayersOrder = function () {
    app.stage.children.sort(function (a, b) {
      a.zIndex = a.zIndex || 0;
      b.zIndex = b.zIndex || 0;
      return a.zIndex - b.zIndex;
    });
  };

  function init(x, y, size) {
    if (app.renderer.type === PIXI.RENDERER_TYPE.WEBGL) {
      console.log("Using WebGL");
    } else {
      console.log("Using Canvas");
    }

    setBackground(x, y);
    setScore();
    setDebug();
    buildSquirmer(x, y, size);
    looper();
  }

  function setBackground(x, y) {
    bg.position.x = x;
    bg.position.y = y;
    bg.anchor.x = 0.5;
    bg.anchor.y = 0.5;
    bg.zIndex = 1;
    bg.interactive = true;
    bg.on("mousedown", function () {
      overdrive = 2;
    });
    bg.on("mouseup", function () {
      overdrive = 1;
    });

    app.stage.addChild(bg);

    /*
      ch.position.x = win.mid.x
      ch.position.y = win.mid.y
      ch.anchor.x = .5
      ch.anchor.y = .5
      ch.zIndex = 10000
      app.stage.addChild(ch)
      */
  }

  function setScore() {
    scoreText.position.x = 0;
    scoreText.position.y = win.height;
    scoreText.anchor.x = 0;
    scoreText.anchor.y = 1;
    scoreText.zIndex = 10000;
    app.stage.addChild(scoreText);
  }

  function setDebug() {
    debugText.position.x = win.width;
    debugText.position.y = win.height;
    debugText.anchor.x = 1;
    debugText.anchor.y = 1;
    debugText.zIndex = 10000;
    app.stage.addChild(debugText);
  }

  function updateDebugText(o, n) {
    debugText.text = "oldrads: " + o.toFixed(2) + "\nnewrads: " + n.toFixed(2);
  }

  function sendToServer(data) {
    ws.send(data, function (err) {
      console.log("ERROR");
      console.log(err);
    });
  }

  function checkMsg(data) {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.log(e);
    }

    if (data.dataType == "initcon") {
      console.log(data);
      playerNum = data.playerNum;
      squirmSize = data.size;
      coords = data.coords;
      init(coords[0].x, coords[0].y, squirmSize);
    }

    if (data.dataType == "movement") {
      var mecoords = [];
      var players = [];

      for (var i = 0; i < data.all.length; i++) {
        if (data.all[i].playerNum == playerNum) {
          mecoords = data.all[i].coords;
        } else {
          players.push(data.all[i]);
        }
      }

      var toffset = {
        x: coords[0].x - mecoords[0].x,
        y: coords[0].y - mecoords[0].y,
      };

      offset.x -= toffset.x;
      offset.y -= toffset.y;

      moveBg(toffset.x, toffset.y);
      moveFood(toffset.x, toffset.y);
      coords = mecoords;

      for (i = 0; i < coords.length; i++) {
        me[i].rotation = coords[i].rotation;
        me[i].position.x = coords[i].x - offset.x;
        me[i].position.y = coords[i].y - offset.y;
      }
      checkOthers(players);
    }
  }

  function checkOthers(players) {
    var alreadyExists;
    othersCoords = players;
    if (othersCoords.length > 0) {
      for (var i = 0; i < othersCoords.length; i++) {
        alreadyExists = false;
        for (var ii = 0; ii < others.length; ii++) {
          if (othersCoords[i].playerNum == others[ii].playerNum) {
            alreadyExists = true;
            moveOther(ii, othersCoords[i]);
          }
        }
        if (!alreadyExists) {
          var size = othersCoords[i].coords.length - 1;
          createOther(othersCoords[i], size);
        }
      }
    }
    var notPlaying;
    if (others.length > 0) {
      for (i = 0; i < others.length; i++) {
        notPlaying = true;
        for (ii = 0; ii < othersCoords.length; ii++) {
          if (others[i].playerNum == othersCoords[ii].playerNum) {
            notPlaying = false;
          }
        }
        if (notPlaying) {
          for (var a = 0; a < others[i].length; a++) {
            app.stage.removeChild(others[i][a]);
          }
          others.splice(i, 1);
        }
      }
    }
  }

  function moveOther(oindex, coords) {
    for (var i = 0; i < others[oindex].length; i++) {
      others[oindex][i].rotation = coords.coords[i].rotation;
      others[oindex][i].position.x = coords.coords[i].x - offset.x;
      others[oindex][i].position.y = coords.coords[i].y - offset.y;
    }
  }

  function createOther(other, size) {
    var zi = size + 10;
    var face = new PIXI.Sprite(textureFace);
    face.position.x = other.coords[0].x - offset.x;
    face.position.y = other.coords[0].y - offset.y;
    face.anchor.x = 0.5;
    face.anchor.y = 0.5;
    face.scale.x = 0.4;
    face.scale.y = 0.4;
    face.zIndex = 9000;

    var body = [];
    for (var i = 0; i < size; i++) {
      body[i] = new PIXI.Sprite(textureBody);
      body[i].anchor.x = 0.5;
      body[i].anchor.y = 0.5;
      body[i].position.x = other.coords[i + 1].x - offset.x;
      body[i].position.y = other.coords[i + 1].y - offset.y;
      body[i].scale.x = 0.4;
      body[i].scale.y = 0.4;
      body[i].zIndex = zi - i;
    }

    var index = others.length;
    others[index] = [];

    others[index][0] = face;
    body.forEach(function (item) {
      others[index].push(item);
    });

    others[index].playerNum = other.playerNum;

    var adder = [].concat(others[index]).reverse();
    adder.forEach(function (item) {
      app.stage.addChild(item);
    });
  }

  function movement() {
    var speed = baseSpeed * overdrive;
    var distance = {
      total: 0,
      x: 0,
      y: 0,
    };
    distance.x = mouse.x - win.mid.x;
    distance.y = mouse.y - win.mid.y;
    var oldrads = me[0].rotation == undefined ? 0 : +me[0].rotation.toFixed(2);
    var newrads = Math.atan2(distance.y, distance.x);
    var direction = undefined;

    updateDebugText(oldrads, newrads);

    // breaking the screen up into 4 quads to determine direction
    if (
      (oldrads <= 0 &&
        Math.abs(oldrads) >= h.rightAngle() &&
        newrads <= 0 &&
        Math.abs(newrads) >= h.rightAngle()) ||
      (oldrads >= 0 &&
        Math.abs(oldrads) >= h.rightAngle() &&
        newrads >= 0 &&
        Math.abs(newrads) >= h.rightAngle()) ||
      (oldrads <= 0 &&
        Math.abs(oldrads) <= h.rightAngle() &&
        newrads <= 0 &&
        Math.abs(newrads) <= h.rightAngle()) ||
      (oldrads >= 0 &&
        Math.abs(oldrads) <= h.rightAngle() &&
        newrads >= 0 &&
        Math.abs(newrads) <= h.rightAngle())
    ) {
      // console.log("SAME QUAD NAV")
      if (oldrads < newrads) {
        if (direction != undefined) {
          console.log("DIRECTION WAS: " + direction);
          console.log("DIRECTION NOW: cw");
        }
        direction = "cw";
      }
      if (oldrads > newrads) {
        if (direction != undefined) {
          console.log("DIRECTION WAS: " + direction);
          console.log("DIRECTION NOW: ccw");
        }
        direction = "ccw";
      }
    }

    if (
      (oldrads <= 0 &&
        Math.abs(oldrads) >= h.rightAngle() &&
        newrads <= 0 &&
        Math.abs(newrads) <= h.rightAngle()) ||
      (oldrads >= 0 &&
        Math.abs(oldrads) >= h.rightAngle() &&
        newrads >= 0 &&
        Math.abs(newrads) <= h.rightAngle()) ||
      (oldrads <= 0 &&
        Math.abs(oldrads) <= h.rightAngle() &&
        newrads >= 0 &&
        Math.abs(newrads) <= h.rightAngle()) ||
      (oldrads >= 0 &&
        Math.abs(oldrads) >= h.rightAngle() &&
        newrads <= 0 &&
        Math.abs(newrads) >= h.rightAngle())
    ) {
      if (direction != undefined) {
        console.log("DIRECTION WAS: " + direction);
        console.log("DIRECTION NOW: cw");
      }
      direction = "cw";
    }
    if (
      (oldrads <= 0 &&
        Math.abs(oldrads) <= h.rightAngle() &&
        newrads <= 0 &&
        Math.abs(newrads) >= h.rightAngle()) ||
      (oldrads >= 0 &&
        Math.abs(oldrads) <= h.rightAngle() &&
        newrads >= 0 &&
        Math.abs(newrads) >= h.rightAngle()) ||
      (oldrads <= 0 &&
        Math.abs(oldrads) >= h.rightAngle() &&
        newrads >= 0 &&
        Math.abs(newrads) >= h.rightAngle()) ||
      (oldrads >= 0 &&
        Math.abs(oldrads) <= h.rightAngle() &&
        newrads <= 0 &&
        Math.abs(newrads) <= h.rightAngle())
    ) {
      if (direction != undefined) {
        console.log("DIRECTION WAS: " + direction);
        console.log("DIRECTION NOW: ccw");
      }
      direction = "ccw";
    }

    if (direction === undefined) {
      console.log("direction is undefined!");
    }

    var data = {
      dataType: "movement",
      curRads: oldrads,
      newRads: newrads,
      direction: direction,
      speed: overdrive,
      coords: coords,
    };

    sendToServer(JSON.stringify(data));
  }

  function checkFoodCollisions() {
    if (food.length > 0) {
      food.forEach(function (item) {
        if (h.circleCollision(me[0], item)) {
          eatFood(item);
        }
      });
    }
  }

  function updateScoreText(sc, si) {
    scoreText.text = "Score: " + Math.round(sc) + "\nSize: " + si;
  }

  function eatFood(f) {
    var index = food.indexOf(f);
    app.stage.removeChild(f);
    score += 10 * f.scale.x;
    updateScoreText(score, squirmSize);
    food.splice(index, 1);
    checkGrowth();
  }

  function checkGrowth() {
    var newSize = Math.round(score / 10) + 10;
    if (newSize > squirmSize) {
      var diff = newSize - squirmSize;
      for (var i = 0; i < diff; i++) {
        var newSeg = new PIXI.Sprite(textureBody);
        var last = me.length - 1;
        newSeg.anchor.x = 0.5;
        newSeg.anchor.y = 0.5;
        newSeg.position.x = me[last].position.x;
        newSeg.position.y = me[last].position.y;
        newSeg.scale.x = 0.4;
        newSeg.scale.y = 0.4;
        newSeg.zIndex = newSize + 11;
        app.stage.addChild(newSeg);
        me.push(newSeg);
        coords.push({ x: coords[last].x, y: coords[last].y });
      }
      for (i = 0; i < me.length; i++) {
        me[i].zIndex = newSize - i + 10;
      }
      squirmSize = newSize;
    }
  }

  function moveBg(x, y) {
    bg.position.x += x;
    bg.position.y += y;
  }

  function moveFood(x, y) {
    food.forEach(function (item) {
      item.position.x += x;
      item.position.y += y;
    });
  }

  function buildSquirmer(x, y, size) {
    size = size < 1 ? 1 : size;

    // zindex for scoreText is 10000
    // zindex for face is 9000
    // zindex for body is 10 to (size + 10)
    // zindex for food is 5
    // zidnex for bg is 1
    var zi = size + 10;

    offset.x = x - win.mid.x;
    offset.y = y - win.mid.y;

    var face = new PIXI.Sprite(textureFace);
    face.position.x = win.mid.x;
    face.position.y = win.mid.y;
    face.anchor.x = 0.5;
    face.anchor.y = 0.5;
    face.scale.x = 0.4;
    face.scale.y = 0.4;
    face.zIndex = 9000;

    var body = [];
    for (var i = 0; i < size; i++) {
      body[i] = new PIXI.Sprite(textureBody);
      body[i].anchor.x = 0.5;
      body[i].anchor.y = 0.5;
      body[i].position.x = face.position.x;
      body[i].position.y = face.position.y;
      body[i].scale.x = 0.4;
      body[i].scale.y = 0.4;
      body[i].zIndex = zi - i;
    }

    me[0] = face;
    body.forEach(function (item) {
      me.push(item);
    });

    var adder = [].concat(me).reverse();
    adder.forEach(function (item) {
      app.stage.addChild(item);
    });
  }

  function makeFood() {
    if (h.getRand(1, 100) > 98) {
      var fScale = h.getRand(0.2, 0.7);
      var newFood = new PIXI.Sprite(textureFood);
      newFood.anchor.x = 0.5;
      newFood.anchor.y = 0.5;
      newFood.position.x = h.getRand(0, win.width);
      newFood.position.y = h.getRand(0, win.height);
      newFood.scale.x = fScale;
      newFood.scale.y = fScale;
      newFood.zIndex = 5;
      food.push(newFood);
      app.stage.addChild(newFood);
    }
  }

  function looper() {
    requestAnimationFrame(looper);
    if (wsOpen) {
      movement();
      //    checkFoodCollisions()
      //    makeFood()
      app.stage.updateLayersOrder();
    }
    app.renderer.render(app.stage);
  }

  function resize() {
    if (
      win.width != document.documentElement.clientWidth ||
      win.height != document.documentElement.clientHeight
    ) {
      var xdiff = win.width - document.documentElement.clientWidth;
      var ydiff = win.height - document.documentElement.clientHeight;
      offset.x += xdiff / 2;
      offset.y += ydiff / 2;
      moveBg(-xdiff / 2, -ydiff / 2);
      moveFood(-xdiff / 2, -ydiff / 2);
      win = {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        mid: {
          x: document.documentElement.clientWidth / 2,
          y: document.documentElement.clientHeight / 2,
        },
      };
    }
    app.renderer.resize(win.width, win.height);
  }
})();

},{"./helper":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyL2NvcmUuanMiLCJicm93c2VyL2hlbHBlci5qcyIsImJyb3dzZXIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsInJlcXVpcmUoJy4vbWFpbicpXG4iLCJ2YXIgckFuZ2xlID0gOTAgKiAoTWF0aC5QSSAvIDE4MClcbnZhciBzTGluZSA9IDE4MCAqIChNYXRoLlBJIC8gMTgwKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgIGdldFJhbmQ6IGZ1bmN0aW9uIChtaW4sIG1heCkge1xuICAgICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbjtcbiAgIH0sXG4gICBnZXROZXdQb2ludDogZnVuY3Rpb24gKHgsIHksIGFuZ2xlLCBkaXN0YW5jZSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgIHg6ICsoTWF0aC5jb3MoYW5nbGUpICogZGlzdGFuY2UgKyB4KS50b0ZpeGVkKDIpLFxuICAgICAgICAgeTogKyhNYXRoLnNpbihhbmdsZSkgKiBkaXN0YW5jZSArIHkpLnRvRml4ZWQoMilcbiAgICAgIH1cbiAgIH0sXG4gICByYWQyZGVnOiBmdW5jdGlvbiAocmFkcykge1xuICAgICAgcmV0dXJuIHJhZHMgKiAoMTgwIC8gTWF0aC5QSSk7XG4gICB9LFxuICAgZGVnMnJhZDogZnVuY3Rpb24gKGRlZykge1xuICAgICAgcmV0dXJuIGRlZyAqIChNYXRoLlBJIC8gMTgwKVxuICAgfSxcbiAgIHJpZ2h0QW5nbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiByQW5nbGVcbiAgIH0sXG4gICBzdHJMaW5lOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gc0xpbmVcbiAgIH0sXG4gICB0ZXN0Q29sbGlzaW9uOiBmdW5jdGlvbiAocjEsIHIyKSB7XG4gICAgICB2YXIgY29tYmluZWRIYWxmV2lkdGhzLCBjb21iaW5lZEhhbGZIZWlnaHRzLCB2eCwgdnk7XG5cbiAgICAgIHIxLmNlbnRlclggPSByMS5wb3NpdGlvbi54ICsgcjEud2lkdGggLyAyO1xuICAgICAgcjEuY2VudGVyWSA9IHIxLnBvc2l0aW9uLnkgKyByMS5oZWlnaHQgLyAyO1xuICAgICAgcjIuY2VudGVyWCA9IHIyLnBvc2l0aW9uLnggKyByMi53aWR0aCAvIDI7XG4gICAgICByMi5jZW50ZXJZID0gcjIucG9zaXRpb24ueSArIHIyLmhlaWdodCAvIDI7XG5cbiAgICAgIHIxLmhhbGZXaWR0aCA9IHIxLndpZHRoIC8gMjtcbiAgICAgIHIxLmhhbGZIZWlnaHQgPSByMS5oZWlnaHQgLyAyO1xuICAgICAgcjIuaGFsZldpZHRoID0gcjIud2lkdGggLyAyO1xuICAgICAgcjIuaGFsZkhlaWdodCA9IHIyLmhlaWdodCAvIDI7XG5cbiAgICAgIHZ4ID0gcjEuY2VudGVyWCAtIHIyLmNlbnRlclg7XG4gICAgICB2eSA9IHIxLmNlbnRlclkgLSByMi5jZW50ZXJZO1xuXG4gICAgICBjb21iaW5lZEhhbGZXaWR0aHMgPSByMS5oYWxmV2lkdGggKyByMi5oYWxmV2lkdGg7XG4gICAgICBjb21iaW5lZEhhbGZIZWlnaHRzID0gcjEuaGFsZkhlaWdodCArIHIyLmhhbGZIZWlnaHQ7XG5cbiAgICAgIHJldHVybiAoTWF0aC5hYnModngpIDwgY29tYmluZWRIYWxmV2lkdGhzICYmIE1hdGguYWJzKHZ5KSA8IGNvbWJpbmVkSGFsZkhlaWdodHMpXG4gICB9LFxuICAgY2lyY2xlQ29sbGlzaW9uOiBmdW5jdGlvbihyMSwgcjIpIHtcbiAgICAgIHZhciBkeCA9IHIxLnBvc2l0aW9uLnggLSByMi5wb3NpdGlvbi54O1xuICAgICAgdmFyIGR5ID0gcjEucG9zaXRpb24ueSAtIHIyLnBvc2l0aW9uLnk7XG4gICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXG4gICAgICByZXR1cm4gKGRpc3RhbmNlIDwgKHIxLndpZHRoIC8gMikgKyAocjIud2lkdGggLyAyKSlcbiAgIH1cbn0iLCIoZnVuY3Rpb24gKCkge1xuICBjb25zdCBoID0gcmVxdWlyZShcIi4vaGVscGVyXCIpO1xuICBjb25zdCB3aW4gPSB7XG4gICAgd2lkdGg6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCxcbiAgICBoZWlnaHQ6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQsXG4gICAgbWlkOiB7XG4gICAgICB4OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggLyAyLFxuICAgICAgeTogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCAvIDIsXG4gICAgfSxcbiAgfTtcbiAgY29uc3Qgb2Zmc2V0ID0geyB4OiAwLCB5OiAwIH07XG4gIGNvbnN0IGFwcCA9IG5ldyBQSVhJLkFwcGxpY2F0aW9uKHtcbiAgICB3aWR0aDogd2luLndpZHRoLFxuICAgIGhlaWdodDogd2luLmhlaWdodCxcbiAgICBhbnRpYWxpYXM6IHRydWUsXG4gIH0pO1xuICB2YXIgdGV4dHVyZUZhY2UgPSBQSVhJLlRleHR1cmUuZnJvbShcImltYWdlcy9iYXR3b3JtLnBuZ1wiKTtcbiAgdmFyIHRleHR1cmVCb2R5ID0gUElYSS5UZXh0dXJlLmZyb20oXCJpbWFnZXMvYmF0Ym9keS5wbmdcIik7XG4gIHZhciB0ZXh0dXJlRm9vZCA9IFBJWEkuVGV4dHVyZS5mcm9tKFwiaW1hZ2VzL2NpcmNsZTIucG5nXCIpO1xuICAvLyB2YXIgY2ggPSBuZXcgUElYSS5TcHJpdGUoUElYSS5UZXh0dXJlLmZyb20oJ2ltYWdlcy9jcm9zc2hhaXIucG5nJykpXG4gIHZhciBiZyA9IG5ldyBQSVhJLlNwcml0ZShQSVhJLlRleHR1cmUuZnJvbShcImltYWdlcy9iZy5qcGdcIikpO1xuICB2YXIgc2NvcmUgPSAwO1xuICB2YXIgc3F1aXJtU2l6ZSA9IDA7XG4gIHZhciBzY29yZVN0eWxlID0ge1xuICAgIGZvbnRGYW1pbHk6IFwiQXJpYWxcIixcbiAgICBmb250U2l6ZTogMTgsXG4gICAgZmlsbDogXCJ3aGl0ZVwiLFxuICAgIHN0cm9rZTogXCJibGFja1wiLFxuICAgIHN0cm9rZVRoaWNrbmVzczogNCxcbiAgfTtcbiAgdmFyIHNjb3JlVGV4dCA9IG5ldyBQSVhJLlRleHQoXG4gICAgXCJTY29yZTogXCIgKyBzY29yZSArIFwiXFxuU2l6ZTogXCIgKyBzcXVpcm1TaXplLFxuICAgIHNjb3JlU3R5bGVcbiAgKTtcbiAgdmFyIGRlYnVnU3R5bGUgPSB7XG4gICAgZm9udEZhbWlseTogXCJBcmlhbFwiLFxuICAgIGZvbnRTaXplOiAxOCxcbiAgICBmaWxsOiBcIndoaXRlXCIsXG4gICAgc3Ryb2tlOiBcImJsYWNrXCIsXG4gICAgc3Ryb2tlVGhpY2tuZXNzOiA0LFxuICB9O1xuICB2YXIgZGVidWdUZXh0ID0gbmV3IFBJWEkuVGV4dChcbiAgICBcIm9sZHJhZHM6IFwiICsgMCArIFwiXFxubmV3cmFkczogXCIgKyAwLFxuICAgIGRlYnVnU3R5bGVcbiAgKTtcbiAgdmFyIG1lID0gW107XG4gIHZhciBvdGhlcnMgPSBbXTtcbiAgdmFyIG90aGVyc0Nvb3JkcyA9IFtdO1xuICB2YXIgbnVtT2ZQbGF5ZXJzID0gMTtcbiAgdmFyIGNvb3JkcyA9IFtdO1xuICB2YXIgZm9vZCA9IFtdO1xuICB2YXIgbW91c2UgPSBhcHAucmVuZGVyZXIucGx1Z2lucy5pbnRlcmFjdGlvbi5tb3VzZS5nbG9iYWw7XG4gIHZhciBiYXNlU3BlZWQgPSAzO1xuICB2YXIgb3ZlcmRyaXZlID0gMTtcbiAgdmFyIHdzT3BlbiA9IGZhbHNlO1xuICB2YXIgcGxheWVyTnVtID0gMDtcblxuICB2YXIgSE9TVCA9IGxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlKC9eaHR0cC8sIFwid3NcIik7XG4gIHZhciB3cyA9IG5ldyBXZWJTb2NrZXQoSE9TVCk7XG5cbiAgLy8gIHZhciBob3N0ID0gbG9jYXRpb24ub3JpZ2luLnJlcGxhY2UoLzouKi8sICcnKVxuICAvLyAgdmFyIHdzID0gbmV3IFdlYlNvY2tldCgnd3M6Ly8nICsgaG9zdCArICc6ODA4MCcpXG5cbiAgd3Mub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgY2hlY2tNc2coZXZlbnQuZGF0YSk7XG4gIH07XG5cbiAgd3Mub25vcGVuID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgd3NPcGVuID0gdHJ1ZTtcbiAgfTtcblxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGFwcC5yZW5kZXJlci52aWV3KTtcblxuICB3aW5kb3cub25yZXNpemUgPSByZXNpemU7XG5cbiAgYXBwLnN0YWdlLnVwZGF0ZUxheWVyc09yZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIGFwcC5zdGFnZS5jaGlsZHJlbi5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICBhLnpJbmRleCA9IGEuekluZGV4IHx8IDA7XG4gICAgICBiLnpJbmRleCA9IGIuekluZGV4IHx8IDA7XG4gICAgICByZXR1cm4gYS56SW5kZXggLSBiLnpJbmRleDtcbiAgICB9KTtcbiAgfTtcblxuICBmdW5jdGlvbiBpbml0KHgsIHksIHNpemUpIHtcbiAgICBpZiAoYXBwLnJlbmRlcmVyLnR5cGUgPT09IFBJWEkuUkVOREVSRVJfVFlQRS5XRUJHTCkge1xuICAgICAgY29uc29sZS5sb2coXCJVc2luZyBXZWJHTFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coXCJVc2luZyBDYW52YXNcIik7XG4gICAgfVxuXG4gICAgc2V0QmFja2dyb3VuZCh4LCB5KTtcbiAgICBzZXRTY29yZSgpO1xuICAgIHNldERlYnVnKCk7XG4gICAgYnVpbGRTcXVpcm1lcih4LCB5LCBzaXplKTtcbiAgICBsb29wZXIoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEJhY2tncm91bmQoeCwgeSkge1xuICAgIGJnLnBvc2l0aW9uLnggPSB4O1xuICAgIGJnLnBvc2l0aW9uLnkgPSB5O1xuICAgIGJnLmFuY2hvci54ID0gMC41O1xuICAgIGJnLmFuY2hvci55ID0gMC41O1xuICAgIGJnLnpJbmRleCA9IDE7XG4gICAgYmcuaW50ZXJhY3RpdmUgPSB0cnVlO1xuICAgIGJnLm9uKFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgIG92ZXJkcml2ZSA9IDI7XG4gICAgfSk7XG4gICAgYmcub24oXCJtb3VzZXVwXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgIG92ZXJkcml2ZSA9IDE7XG4gICAgfSk7XG5cbiAgICBhcHAuc3RhZ2UuYWRkQ2hpbGQoYmcpO1xuXG4gICAgLypcbiAgICAgIGNoLnBvc2l0aW9uLnggPSB3aW4ubWlkLnhcbiAgICAgIGNoLnBvc2l0aW9uLnkgPSB3aW4ubWlkLnlcbiAgICAgIGNoLmFuY2hvci54ID0gLjVcbiAgICAgIGNoLmFuY2hvci55ID0gLjVcbiAgICAgIGNoLnpJbmRleCA9IDEwMDAwXG4gICAgICBhcHAuc3RhZ2UuYWRkQ2hpbGQoY2gpXG4gICAgICAqL1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0U2NvcmUoKSB7XG4gICAgc2NvcmVUZXh0LnBvc2l0aW9uLnggPSAwO1xuICAgIHNjb3JlVGV4dC5wb3NpdGlvbi55ID0gd2luLmhlaWdodDtcbiAgICBzY29yZVRleHQuYW5jaG9yLnggPSAwO1xuICAgIHNjb3JlVGV4dC5hbmNob3IueSA9IDE7XG4gICAgc2NvcmVUZXh0LnpJbmRleCA9IDEwMDAwO1xuICAgIGFwcC5zdGFnZS5hZGRDaGlsZChzY29yZVRleHQpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0RGVidWcoKSB7XG4gICAgZGVidWdUZXh0LnBvc2l0aW9uLnggPSB3aW4ud2lkdGg7XG4gICAgZGVidWdUZXh0LnBvc2l0aW9uLnkgPSB3aW4uaGVpZ2h0O1xuICAgIGRlYnVnVGV4dC5hbmNob3IueCA9IDE7XG4gICAgZGVidWdUZXh0LmFuY2hvci55ID0gMTtcbiAgICBkZWJ1Z1RleHQuekluZGV4ID0gMTAwMDA7XG4gICAgYXBwLnN0YWdlLmFkZENoaWxkKGRlYnVnVGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVEZWJ1Z1RleHQobywgbikge1xuICAgIGRlYnVnVGV4dC50ZXh0ID0gXCJvbGRyYWRzOiBcIiArIG8udG9GaXhlZCgyKSArIFwiXFxubmV3cmFkczogXCIgKyBuLnRvRml4ZWQoMik7XG4gIH1cblxuICBmdW5jdGlvbiBzZW5kVG9TZXJ2ZXIoZGF0YSkge1xuICAgIHdzLnNlbmQoZGF0YSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgY29uc29sZS5sb2coXCJFUlJPUlwiKTtcbiAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBjaGVja01zZyhkYXRhKSB7XG4gICAgdHJ5IHtcbiAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgIH1cblxuICAgIGlmIChkYXRhLmRhdGFUeXBlID09IFwiaW5pdGNvblwiKSB7XG4gICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgIHBsYXllck51bSA9IGRhdGEucGxheWVyTnVtO1xuICAgICAgc3F1aXJtU2l6ZSA9IGRhdGEuc2l6ZTtcbiAgICAgIGNvb3JkcyA9IGRhdGEuY29vcmRzO1xuICAgICAgaW5pdChjb29yZHNbMF0ueCwgY29vcmRzWzBdLnksIHNxdWlybVNpemUpO1xuICAgIH1cblxuICAgIGlmIChkYXRhLmRhdGFUeXBlID09IFwibW92ZW1lbnRcIikge1xuICAgICAgdmFyIG1lY29vcmRzID0gW107XG4gICAgICB2YXIgcGxheWVycyA9IFtdO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEuYWxsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChkYXRhLmFsbFtpXS5wbGF5ZXJOdW0gPT0gcGxheWVyTnVtKSB7XG4gICAgICAgICAgbWVjb29yZHMgPSBkYXRhLmFsbFtpXS5jb29yZHM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGxheWVycy5wdXNoKGRhdGEuYWxsW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgdG9mZnNldCA9IHtcbiAgICAgICAgeDogY29vcmRzWzBdLnggLSBtZWNvb3Jkc1swXS54LFxuICAgICAgICB5OiBjb29yZHNbMF0ueSAtIG1lY29vcmRzWzBdLnksXG4gICAgICB9O1xuXG4gICAgICBvZmZzZXQueCAtPSB0b2Zmc2V0Lng7XG4gICAgICBvZmZzZXQueSAtPSB0b2Zmc2V0Lnk7XG5cbiAgICAgIG1vdmVCZyh0b2Zmc2V0LngsIHRvZmZzZXQueSk7XG4gICAgICBtb3ZlRm9vZCh0b2Zmc2V0LngsIHRvZmZzZXQueSk7XG4gICAgICBjb29yZHMgPSBtZWNvb3JkcztcblxuICAgICAgZm9yIChpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBtZVtpXS5yb3RhdGlvbiA9IGNvb3Jkc1tpXS5yb3RhdGlvbjtcbiAgICAgICAgbWVbaV0ucG9zaXRpb24ueCA9IGNvb3Jkc1tpXS54IC0gb2Zmc2V0Lng7XG4gICAgICAgIG1lW2ldLnBvc2l0aW9uLnkgPSBjb29yZHNbaV0ueSAtIG9mZnNldC55O1xuICAgICAgfVxuICAgICAgY2hlY2tPdGhlcnMocGxheWVycyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2hlY2tPdGhlcnMocGxheWVycykge1xuICAgIHZhciBhbHJlYWR5RXhpc3RzO1xuICAgIG90aGVyc0Nvb3JkcyA9IHBsYXllcnM7XG4gICAgaWYgKG90aGVyc0Nvb3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG90aGVyc0Nvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBhbHJlYWR5RXhpc3RzID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBvdGhlcnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgaWYgKG90aGVyc0Nvb3Jkc1tpXS5wbGF5ZXJOdW0gPT0gb3RoZXJzW2lpXS5wbGF5ZXJOdW0pIHtcbiAgICAgICAgICAgIGFscmVhZHlFeGlzdHMgPSB0cnVlO1xuICAgICAgICAgICAgbW92ZU90aGVyKGlpLCBvdGhlcnNDb29yZHNbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFscmVhZHlFeGlzdHMpIHtcbiAgICAgICAgICB2YXIgc2l6ZSA9IG90aGVyc0Nvb3Jkc1tpXS5jb29yZHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICBjcmVhdGVPdGhlcihvdGhlcnNDb29yZHNbaV0sIHNpemUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBub3RQbGF5aW5nO1xuICAgIGlmIChvdGhlcnMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChpID0gMDsgaSA8IG90aGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBub3RQbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgb3RoZXJzQ29vcmRzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGlmIChvdGhlcnNbaV0ucGxheWVyTnVtID09IG90aGVyc0Nvb3Jkc1tpaV0ucGxheWVyTnVtKSB7XG4gICAgICAgICAgICBub3RQbGF5aW5nID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChub3RQbGF5aW5nKSB7XG4gICAgICAgICAgZm9yICh2YXIgYSA9IDA7IGEgPCBvdGhlcnNbaV0ubGVuZ3RoOyBhKyspIHtcbiAgICAgICAgICAgIGFwcC5zdGFnZS5yZW1vdmVDaGlsZChvdGhlcnNbaV1bYV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBvdGhlcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbW92ZU90aGVyKG9pbmRleCwgY29vcmRzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvdGhlcnNbb2luZGV4XS5sZW5ndGg7IGkrKykge1xuICAgICAgb3RoZXJzW29pbmRleF1baV0ucm90YXRpb24gPSBjb29yZHMuY29vcmRzW2ldLnJvdGF0aW9uO1xuICAgICAgb3RoZXJzW29pbmRleF1baV0ucG9zaXRpb24ueCA9IGNvb3Jkcy5jb29yZHNbaV0ueCAtIG9mZnNldC54O1xuICAgICAgb3RoZXJzW29pbmRleF1baV0ucG9zaXRpb24ueSA9IGNvb3Jkcy5jb29yZHNbaV0ueSAtIG9mZnNldC55O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZU90aGVyKG90aGVyLCBzaXplKSB7XG4gICAgdmFyIHppID0gc2l6ZSArIDEwO1xuICAgIHZhciBmYWNlID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmVGYWNlKTtcbiAgICBmYWNlLnBvc2l0aW9uLnggPSBvdGhlci5jb29yZHNbMF0ueCAtIG9mZnNldC54O1xuICAgIGZhY2UucG9zaXRpb24ueSA9IG90aGVyLmNvb3Jkc1swXS55IC0gb2Zmc2V0Lnk7XG4gICAgZmFjZS5hbmNob3IueCA9IDAuNTtcbiAgICBmYWNlLmFuY2hvci55ID0gMC41O1xuICAgIGZhY2Uuc2NhbGUueCA9IDAuNDtcbiAgICBmYWNlLnNjYWxlLnkgPSAwLjQ7XG4gICAgZmFjZS56SW5kZXggPSA5MDAwO1xuXG4gICAgdmFyIGJvZHkgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgYm9keVtpXSA9IG5ldyBQSVhJLlNwcml0ZSh0ZXh0dXJlQm9keSk7XG4gICAgICBib2R5W2ldLmFuY2hvci54ID0gMC41O1xuICAgICAgYm9keVtpXS5hbmNob3IueSA9IDAuNTtcbiAgICAgIGJvZHlbaV0ucG9zaXRpb24ueCA9IG90aGVyLmNvb3Jkc1tpICsgMV0ueCAtIG9mZnNldC54O1xuICAgICAgYm9keVtpXS5wb3NpdGlvbi55ID0gb3RoZXIuY29vcmRzW2kgKyAxXS55IC0gb2Zmc2V0Lnk7XG4gICAgICBib2R5W2ldLnNjYWxlLnggPSAwLjQ7XG4gICAgICBib2R5W2ldLnNjYWxlLnkgPSAwLjQ7XG4gICAgICBib2R5W2ldLnpJbmRleCA9IHppIC0gaTtcbiAgICB9XG5cbiAgICB2YXIgaW5kZXggPSBvdGhlcnMubGVuZ3RoO1xuICAgIG90aGVyc1tpbmRleF0gPSBbXTtcblxuICAgIG90aGVyc1tpbmRleF1bMF0gPSBmYWNlO1xuICAgIGJvZHkuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgb3RoZXJzW2luZGV4XS5wdXNoKGl0ZW0pO1xuICAgIH0pO1xuXG4gICAgb3RoZXJzW2luZGV4XS5wbGF5ZXJOdW0gPSBvdGhlci5wbGF5ZXJOdW07XG5cbiAgICB2YXIgYWRkZXIgPSBbXS5jb25jYXQob3RoZXJzW2luZGV4XSkucmV2ZXJzZSgpO1xuICAgIGFkZGVyLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIGFwcC5zdGFnZS5hZGRDaGlsZChpdGVtKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmVtZW50KCkge1xuICAgIHZhciBzcGVlZCA9IGJhc2VTcGVlZCAqIG92ZXJkcml2ZTtcbiAgICB2YXIgZGlzdGFuY2UgPSB7XG4gICAgICB0b3RhbDogMCxcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgIH07XG4gICAgZGlzdGFuY2UueCA9IG1vdXNlLnggLSB3aW4ubWlkLng7XG4gICAgZGlzdGFuY2UueSA9IG1vdXNlLnkgLSB3aW4ubWlkLnk7XG4gICAgdmFyIG9sZHJhZHMgPSBtZVswXS5yb3RhdGlvbiA9PSB1bmRlZmluZWQgPyAwIDogK21lWzBdLnJvdGF0aW9uLnRvRml4ZWQoMik7XG4gICAgdmFyIG5ld3JhZHMgPSBNYXRoLmF0YW4yKGRpc3RhbmNlLnksIGRpc3RhbmNlLngpO1xuICAgIHZhciBkaXJlY3Rpb24gPSB1bmRlZmluZWQ7XG5cbiAgICB1cGRhdGVEZWJ1Z1RleHQob2xkcmFkcywgbmV3cmFkcyk7XG5cbiAgICAvLyBicmVha2luZyB0aGUgc2NyZWVuIHVwIGludG8gNCBxdWFkcyB0byBkZXRlcm1pbmUgZGlyZWN0aW9uXG4gICAgaWYgKFxuICAgICAgKG9sZHJhZHMgPD0gMCAmJlxuICAgICAgICBNYXRoLmFicyhvbGRyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSAmJlxuICAgICAgICBuZXdyYWRzIDw9IDAgJiZcbiAgICAgICAgTWF0aC5hYnMobmV3cmFkcykgPj0gaC5yaWdodEFuZ2xlKCkpIHx8XG4gICAgICAob2xkcmFkcyA+PSAwICYmXG4gICAgICAgIE1hdGguYWJzKG9sZHJhZHMpID49IGgucmlnaHRBbmdsZSgpICYmXG4gICAgICAgIG5ld3JhZHMgPj0gMCAmJlxuICAgICAgICBNYXRoLmFicyhuZXdyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkgfHxcbiAgICAgIChvbGRyYWRzIDw9IDAgJiZcbiAgICAgICAgTWF0aC5hYnMob2xkcmFkcykgPD0gaC5yaWdodEFuZ2xlKCkgJiZcbiAgICAgICAgbmV3cmFkcyA8PSAwICYmXG4gICAgICAgIE1hdGguYWJzKG5ld3JhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSB8fFxuICAgICAgKG9sZHJhZHMgPj0gMCAmJlxuICAgICAgICBNYXRoLmFicyhvbGRyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSAmJlxuICAgICAgICBuZXdyYWRzID49IDAgJiZcbiAgICAgICAgTWF0aC5hYnMobmV3cmFkcykgPD0gaC5yaWdodEFuZ2xlKCkpXG4gICAgKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhcIlNBTUUgUVVBRCBOQVZcIilcbiAgICAgIGlmIChvbGRyYWRzIDwgbmV3cmFkcykge1xuICAgICAgICBpZiAoZGlyZWN0aW9uICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIFdBUzogXCIgKyBkaXJlY3Rpb24pO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIE5PVzogY3dcIik7XG4gICAgICAgIH1cbiAgICAgICAgZGlyZWN0aW9uID0gXCJjd1wiO1xuICAgICAgfVxuICAgICAgaWYgKG9sZHJhZHMgPiBuZXdyYWRzKSB7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJESVJFQ1RJT04gV0FTOiBcIiArIGRpcmVjdGlvbik7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJESVJFQ1RJT04gTk9XOiBjY3dcIik7XG4gICAgICAgIH1cbiAgICAgICAgZGlyZWN0aW9uID0gXCJjY3dcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAob2xkcmFkcyA8PSAwICYmXG4gICAgICAgIE1hdGguYWJzKG9sZHJhZHMpID49IGgucmlnaHRBbmdsZSgpICYmXG4gICAgICAgIG5ld3JhZHMgPD0gMCAmJlxuICAgICAgICBNYXRoLmFicyhuZXdyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSkgfHxcbiAgICAgIChvbGRyYWRzID49IDAgJiZcbiAgICAgICAgTWF0aC5hYnMob2xkcmFkcykgPj0gaC5yaWdodEFuZ2xlKCkgJiZcbiAgICAgICAgbmV3cmFkcyA+PSAwICYmXG4gICAgICAgIE1hdGguYWJzKG5ld3JhZHMpIDw9IGgucmlnaHRBbmdsZSgpKSB8fFxuICAgICAgKG9sZHJhZHMgPD0gMCAmJlxuICAgICAgICBNYXRoLmFicyhvbGRyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSAmJlxuICAgICAgICBuZXdyYWRzID49IDAgJiZcbiAgICAgICAgTWF0aC5hYnMobmV3cmFkcykgPD0gaC5yaWdodEFuZ2xlKCkpIHx8XG4gICAgICAob2xkcmFkcyA+PSAwICYmXG4gICAgICAgIE1hdGguYWJzKG9sZHJhZHMpID49IGgucmlnaHRBbmdsZSgpICYmXG4gICAgICAgIG5ld3JhZHMgPD0gMCAmJlxuICAgICAgICBNYXRoLmFicyhuZXdyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSlcbiAgICApIHtcbiAgICAgIGlmIChkaXJlY3Rpb24gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIFdBUzogXCIgKyBkaXJlY3Rpb24pO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkRJUkVDVElPTiBOT1c6IGN3XCIpO1xuICAgICAgfVxuICAgICAgZGlyZWN0aW9uID0gXCJjd1wiO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAob2xkcmFkcyA8PSAwICYmXG4gICAgICAgIE1hdGguYWJzKG9sZHJhZHMpIDw9IGgucmlnaHRBbmdsZSgpICYmXG4gICAgICAgIG5ld3JhZHMgPD0gMCAmJlxuICAgICAgICBNYXRoLmFicyhuZXdyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSkgfHxcbiAgICAgIChvbGRyYWRzID49IDAgJiZcbiAgICAgICAgTWF0aC5hYnMob2xkcmFkcykgPD0gaC5yaWdodEFuZ2xlKCkgJiZcbiAgICAgICAgbmV3cmFkcyA+PSAwICYmXG4gICAgICAgIE1hdGguYWJzKG5ld3JhZHMpID49IGgucmlnaHRBbmdsZSgpKSB8fFxuICAgICAgKG9sZHJhZHMgPD0gMCAmJlxuICAgICAgICBNYXRoLmFicyhvbGRyYWRzKSA+PSBoLnJpZ2h0QW5nbGUoKSAmJlxuICAgICAgICBuZXdyYWRzID49IDAgJiZcbiAgICAgICAgTWF0aC5hYnMobmV3cmFkcykgPj0gaC5yaWdodEFuZ2xlKCkpIHx8XG4gICAgICAob2xkcmFkcyA+PSAwICYmXG4gICAgICAgIE1hdGguYWJzKG9sZHJhZHMpIDw9IGgucmlnaHRBbmdsZSgpICYmXG4gICAgICAgIG5ld3JhZHMgPD0gMCAmJlxuICAgICAgICBNYXRoLmFicyhuZXdyYWRzKSA8PSBoLnJpZ2h0QW5nbGUoKSlcbiAgICApIHtcbiAgICAgIGlmIChkaXJlY3Rpb24gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRElSRUNUSU9OIFdBUzogXCIgKyBkaXJlY3Rpb24pO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkRJUkVDVElPTiBOT1c6IGNjd1wiKTtcbiAgICAgIH1cbiAgICAgIGRpcmVjdGlvbiA9IFwiY2N3XCI7XG4gICAgfVxuXG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zb2xlLmxvZyhcImRpcmVjdGlvbiBpcyB1bmRlZmluZWQhXCIpO1xuICAgIH1cblxuICAgIHZhciBkYXRhID0ge1xuICAgICAgZGF0YVR5cGU6IFwibW92ZW1lbnRcIixcbiAgICAgIGN1clJhZHM6IG9sZHJhZHMsXG4gICAgICBuZXdSYWRzOiBuZXdyYWRzLFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24sXG4gICAgICBzcGVlZDogb3ZlcmRyaXZlLFxuICAgICAgY29vcmRzOiBjb29yZHMsXG4gICAgfTtcblxuICAgIHNlbmRUb1NlcnZlcihKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gIH1cblxuICBmdW5jdGlvbiBjaGVja0Zvb2RDb2xsaXNpb25zKCkge1xuICAgIGlmIChmb29kLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvb2QuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICBpZiAoaC5jaXJjbGVDb2xsaXNpb24obWVbMF0sIGl0ZW0pKSB7XG4gICAgICAgICAgZWF0Rm9vZChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlU2NvcmVUZXh0KHNjLCBzaSkge1xuICAgIHNjb3JlVGV4dC50ZXh0ID0gXCJTY29yZTogXCIgKyBNYXRoLnJvdW5kKHNjKSArIFwiXFxuU2l6ZTogXCIgKyBzaTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVhdEZvb2QoZikge1xuICAgIHZhciBpbmRleCA9IGZvb2QuaW5kZXhPZihmKTtcbiAgICBhcHAuc3RhZ2UucmVtb3ZlQ2hpbGQoZik7XG4gICAgc2NvcmUgKz0gMTAgKiBmLnNjYWxlLng7XG4gICAgdXBkYXRlU2NvcmVUZXh0KHNjb3JlLCBzcXVpcm1TaXplKTtcbiAgICBmb29kLnNwbGljZShpbmRleCwgMSk7XG4gICAgY2hlY2tHcm93dGgoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNoZWNrR3Jvd3RoKCkge1xuICAgIHZhciBuZXdTaXplID0gTWF0aC5yb3VuZChzY29yZSAvIDEwKSArIDEwO1xuICAgIGlmIChuZXdTaXplID4gc3F1aXJtU2l6ZSkge1xuICAgICAgdmFyIGRpZmYgPSBuZXdTaXplIC0gc3F1aXJtU2l6ZTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlmZjsgaSsrKSB7XG4gICAgICAgIHZhciBuZXdTZWcgPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZUJvZHkpO1xuICAgICAgICB2YXIgbGFzdCA9IG1lLmxlbmd0aCAtIDE7XG4gICAgICAgIG5ld1NlZy5hbmNob3IueCA9IDAuNTtcbiAgICAgICAgbmV3U2VnLmFuY2hvci55ID0gMC41O1xuICAgICAgICBuZXdTZWcucG9zaXRpb24ueCA9IG1lW2xhc3RdLnBvc2l0aW9uLng7XG4gICAgICAgIG5ld1NlZy5wb3NpdGlvbi55ID0gbWVbbGFzdF0ucG9zaXRpb24ueTtcbiAgICAgICAgbmV3U2VnLnNjYWxlLnggPSAwLjQ7XG4gICAgICAgIG5ld1NlZy5zY2FsZS55ID0gMC40O1xuICAgICAgICBuZXdTZWcuekluZGV4ID0gbmV3U2l6ZSArIDExO1xuICAgICAgICBhcHAuc3RhZ2UuYWRkQ2hpbGQobmV3U2VnKTtcbiAgICAgICAgbWUucHVzaChuZXdTZWcpO1xuICAgICAgICBjb29yZHMucHVzaCh7IHg6IGNvb3Jkc1tsYXN0XS54LCB5OiBjb29yZHNbbGFzdF0ueSB9KTtcbiAgICAgIH1cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBtZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBtZVtpXS56SW5kZXggPSBuZXdTaXplIC0gaSArIDEwO1xuICAgICAgfVxuICAgICAgc3F1aXJtU2l6ZSA9IG5ld1NpemU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbW92ZUJnKHgsIHkpIHtcbiAgICBiZy5wb3NpdGlvbi54ICs9IHg7XG4gICAgYmcucG9zaXRpb24ueSArPSB5O1xuICB9XG5cbiAgZnVuY3Rpb24gbW92ZUZvb2QoeCwgeSkge1xuICAgIGZvb2QuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgaXRlbS5wb3NpdGlvbi54ICs9IHg7XG4gICAgICBpdGVtLnBvc2l0aW9uLnkgKz0geTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1aWxkU3F1aXJtZXIoeCwgeSwgc2l6ZSkge1xuICAgIHNpemUgPSBzaXplIDwgMSA/IDEgOiBzaXplO1xuXG4gICAgLy8gemluZGV4IGZvciBzY29yZVRleHQgaXMgMTAwMDBcbiAgICAvLyB6aW5kZXggZm9yIGZhY2UgaXMgOTAwMFxuICAgIC8vIHppbmRleCBmb3IgYm9keSBpcyAxMCB0byAoc2l6ZSArIDEwKVxuICAgIC8vIHppbmRleCBmb3IgZm9vZCBpcyA1XG4gICAgLy8gemlkbmV4IGZvciBiZyBpcyAxXG4gICAgdmFyIHppID0gc2l6ZSArIDEwO1xuXG4gICAgb2Zmc2V0LnggPSB4IC0gd2luLm1pZC54O1xuICAgIG9mZnNldC55ID0geSAtIHdpbi5taWQueTtcblxuICAgIHZhciBmYWNlID0gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmVGYWNlKTtcbiAgICBmYWNlLnBvc2l0aW9uLnggPSB3aW4ubWlkLng7XG4gICAgZmFjZS5wb3NpdGlvbi55ID0gd2luLm1pZC55O1xuICAgIGZhY2UuYW5jaG9yLnggPSAwLjU7XG4gICAgZmFjZS5hbmNob3IueSA9IDAuNTtcbiAgICBmYWNlLnNjYWxlLnggPSAwLjQ7XG4gICAgZmFjZS5zY2FsZS55ID0gMC40O1xuICAgIGZhY2UuekluZGV4ID0gOTAwMDtcblxuICAgIHZhciBib2R5ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgIGJvZHlbaV0gPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZUJvZHkpO1xuICAgICAgYm9keVtpXS5hbmNob3IueCA9IDAuNTtcbiAgICAgIGJvZHlbaV0uYW5jaG9yLnkgPSAwLjU7XG4gICAgICBib2R5W2ldLnBvc2l0aW9uLnggPSBmYWNlLnBvc2l0aW9uLng7XG4gICAgICBib2R5W2ldLnBvc2l0aW9uLnkgPSBmYWNlLnBvc2l0aW9uLnk7XG4gICAgICBib2R5W2ldLnNjYWxlLnggPSAwLjQ7XG4gICAgICBib2R5W2ldLnNjYWxlLnkgPSAwLjQ7XG4gICAgICBib2R5W2ldLnpJbmRleCA9IHppIC0gaTtcbiAgICB9XG5cbiAgICBtZVswXSA9IGZhY2U7XG4gICAgYm9keS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICBtZS5wdXNoKGl0ZW0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGFkZGVyID0gW10uY29uY2F0KG1lKS5yZXZlcnNlKCk7XG4gICAgYWRkZXIuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgYXBwLnN0YWdlLmFkZENoaWxkKGl0ZW0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUZvb2QoKSB7XG4gICAgaWYgKGguZ2V0UmFuZCgxLCAxMDApID4gOTgpIHtcbiAgICAgIHZhciBmU2NhbGUgPSBoLmdldFJhbmQoMC4yLCAwLjcpO1xuICAgICAgdmFyIG5ld0Zvb2QgPSBuZXcgUElYSS5TcHJpdGUodGV4dHVyZUZvb2QpO1xuICAgICAgbmV3Rm9vZC5hbmNob3IueCA9IDAuNTtcbiAgICAgIG5ld0Zvb2QuYW5jaG9yLnkgPSAwLjU7XG4gICAgICBuZXdGb29kLnBvc2l0aW9uLnggPSBoLmdldFJhbmQoMCwgd2luLndpZHRoKTtcbiAgICAgIG5ld0Zvb2QucG9zaXRpb24ueSA9IGguZ2V0UmFuZCgwLCB3aW4uaGVpZ2h0KTtcbiAgICAgIG5ld0Zvb2Quc2NhbGUueCA9IGZTY2FsZTtcbiAgICAgIG5ld0Zvb2Quc2NhbGUueSA9IGZTY2FsZTtcbiAgICAgIG5ld0Zvb2QuekluZGV4ID0gNTtcbiAgICAgIGZvb2QucHVzaChuZXdGb29kKTtcbiAgICAgIGFwcC5zdGFnZS5hZGRDaGlsZChuZXdGb29kKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBsb29wZXIoKSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3Blcik7XG4gICAgaWYgKHdzT3Blbikge1xuICAgICAgbW92ZW1lbnQoKTtcbiAgICAgIC8vICAgIGNoZWNrRm9vZENvbGxpc2lvbnMoKVxuICAgICAgLy8gICAgbWFrZUZvb2QoKVxuICAgICAgYXBwLnN0YWdlLnVwZGF0ZUxheWVyc09yZGVyKCk7XG4gICAgfVxuICAgIGFwcC5yZW5kZXJlci5yZW5kZXIoYXBwLnN0YWdlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgICBpZiAoXG4gICAgICB3aW4ud2lkdGggIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIHx8XG4gICAgICB3aW4uaGVpZ2h0ICE9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHRcbiAgICApIHtcbiAgICAgIHZhciB4ZGlmZiA9IHdpbi53aWR0aCAtIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgIHZhciB5ZGlmZiA9IHdpbi5oZWlnaHQgLSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgb2Zmc2V0LnggKz0geGRpZmYgLyAyO1xuICAgICAgb2Zmc2V0LnkgKz0geWRpZmYgLyAyO1xuICAgICAgbW92ZUJnKC14ZGlmZiAvIDIsIC15ZGlmZiAvIDIpO1xuICAgICAgbW92ZUZvb2QoLXhkaWZmIC8gMiwgLXlkaWZmIC8gMik7XG4gICAgICB3aW4gPSB7XG4gICAgICAgIHdpZHRoOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgsXG4gICAgICAgIGhlaWdodDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCxcbiAgICAgICAgbWlkOiB7XG4gICAgICAgICAgeDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIC8gMixcbiAgICAgICAgICB5OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0IC8gMixcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuICAgIGFwcC5yZW5kZXJlci5yZXNpemUod2luLndpZHRoLCB3aW4uaGVpZ2h0KTtcbiAgfVxufSkoKTtcbiJdfQ==
