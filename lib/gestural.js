function $ (sel, node, a) { return (a = [].slice.call( (node || document).querySelectorAll(sel) )).length > 1 ? a : a[0] }
function addEvents (obj) {
  function add(el) { el.addEventListener(a[c], obj[id][e].bind(el), false) }
  for (var id in obj) for (var e in obj[id]) {
    var el = id ? $(id) : window, a = e.split(" "), b = a.length, c = 0;
    for (; c < b; c++) typeof el === "undefined" ? 0 : el.constructor.name === "Array" ? el.forEach(add) : add(el)
  }
}

var Gesture = function () {
  this.active = false;
  this.data = []
}
Gesture.prototype.active = function (v) {
  return this.active = Boolean(v)
}
Gesture.prototype.appendData = function (d) {
  if (!this.active || d.constructor.name !== "Array") return false;
  this.data = this.data.concat([d]);
  return d
}
Gesture.prototype.constructor = Gesture;

var gesture = new Gesture();

addEvents({
  "": {
    devicemotion: function (e) {
      if (gesture.active) $("#accel").textContent = gesture.appendData([e.acceleration.x, e.acceleration.y, e.acceleration.z]);
    },
    deviceorientation: function (e) {
      if (gesture.active) $("#orient").textContent = [e.beta, e.gamma, e.alpha]
    },
    click: function () {
      document.body.classList.toggle("active");
      $("#accel, #orient, #data").forEach(function (a) { a.classList.toggle("hide") });
      if (gesture.active) $("#data").textContent = gesture.data;
      gesture.active = !gesture.active
    }
  }
})
