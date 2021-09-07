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
