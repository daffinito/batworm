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