var players = []
var totalPlayers = 0
var curNumPlayers = 0

module.exports = {
   addPlayer: function(player, nr, num) {
      players[num] = {
         coords: player,
         playerNum: num,
         newRads: nr,
         speed: 1
      }
      totalPlayers += 1
      curNumPlayers += 1
   },
   updatePlayer: function(player, num) {
      players[num].coords =  player
      players.playerNum = num

   },
   updatePlayerRads: function(nr, speed, num) {
      players[num].newRads = nr
      players[num].speed = speed
   },
   getPlayers: function() {
      var retval = []
      for (var i = 1; i < players.length; i++) {
         if (players[i] !== undefined) {
            retval.push(players[i])
         }
      }
      return retval
   },
   getTtlNumPlayers: function() {
      return totalPlayers
   },
   getCurNumPlayers: function() {
      return curNumPlayers
   },
   getOtherPlayers: function(num) {
      var retval= []
      for (var i = 1; i < players.length; i++) {
         if (i != num && players[i] !== undefined) {
            retval.push(players[i])
         }
      }
      return retval
   },
   rmPlayer: function(num) {
      players[num] = undefined
      curNumPlayers -= 1
   }
}