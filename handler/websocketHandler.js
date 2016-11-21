var p = require('./players')
var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ port: 8080 })

setInterval(sendData,10)

wss.on('connection', function (ws) {
   var ttlPlayers = p.getTtlNumPlayers()
   var playerNum = ttlPlayers + 1

   var resp = {
      dataType: "initcon",
      playerNum: playerNum,
      coords: [],
      size: 100
   }

   for (var i = 0; i < resp.size + 1; i++) {
      resp.coords[i] = {x: 600, y: 100, rotation: 0, vx: 0, vy: 0}
   }

   p.addPlayer(resp.coords, resp.playerNum)
   ws.send(JSON.stringify(resp))

   ws.on('message', function (data) {
      data = JSON.parse(data)
      if (data.dataType === 'movement') {
         var result = calculate(data)
         p.updatePlayer(result.coords,playerNum)
         result.players = p.getOtherPlayers(playerNum)
    //     ws.send(JSON.stringify(result))
      }
   })

   ws.on('close', function (code, message) {
      p.rmPlayer(playerNum)
   })

   ws.on('error', function (error) {
      p.rmPlayer(playerNum)
   })
})

function sendData() {
   if (p.getTtlNumPlayers() > 0) {
      var data = {}
      data.all = p.getPlayers()
      data.dataType = "movement"
      wss.clients.forEach(function each(client) {
         try {
            client.send(JSON.stringify(data))
         }
         catch (e) {
            console.log(e)
         }
      })
   }
}

function calculate(data) {
      var resp = data
      resp.coords[0].vx = Math.cos(data.newRads) * data.speed
      resp.coords[0].vy = Math.sin(data.newRads) * data.speed

      var distance = {
         total: 0,
         x: 0,
         y: 0
      }

      resp.coords[0].rotation = data.newRads
      resp.coords[0].x += resp.coords[0].vx
      resp.coords[0].y += resp.coords[0].vy

      for (var i = 1; i < resp.coords.length; i++) {
         distance.x = resp.coords[i - 1].x - resp.coords[i].x
         distance.y = resp.coords[i - 1].y - resp.coords[i].y
         distance.total = Math.hypot(resp.coords[i - 1].x - resp.coords[i].x, resp.coords[i - 1].y - resp.coords[i].y)

         if (distance.total > 5 + data.speed) {
            resp.coords[i].rotation = Math.atan2(distance.y, distance.x)
            resp.coords[i].vx = Math.cos(resp.coords[i].rotation) * data.speed
            resp.coords[i].vy = Math.sin(resp.coords[i].rotation) * data.speed

            resp.coords[i].x += resp.coords[i].vx
            resp.coords[i].y += resp.coords[i].vy
         }

      }
      return resp
}