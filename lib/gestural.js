/// Utilities

function $ (sel, node, a) { return (a = [].slice.call( (node || document).querySelectorAll(sel) )).length > 1 ? a : a[0] }
function addEvents (obj) {
  function add(el) { el.addEventListener(a[c], obj[id][e].bind(el), false) }
  for (var id in obj) for (var e in obj[id]) {
    var el = id ? $(id) : window, a = e.split(" "), b = a.length, c = 0;
    for (; c < b; c++) typeof el === "undefined" ? 0 : el.constructor.name === "Array" ? el.forEach(add) : add(el)
  }
}

/// Graphics

function windowResize(renderer, camera) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
var container = $("#container"),
    width = container.clientWidth,
    height = container.clientHeight;
var view_angle = 45,
    aspect = width / height,
    near = 0.01,
    far = 1000;

var renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
var camera = new THREE.PerspectiveCamera(view_angle, aspect, near, far);
var scene = new THREE.Scene();
windowResize(renderer, camera);
scene.add(camera);
renderer.setSize(width, height);
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);
renderer.domElement.id = "renderer";

var pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(6, 5, 17);
scene.add(pointLight);

var axisHelper = new THREE.AxisHelper(5);
scene.add(axisHelper);
camera.position.set(1, 1, 1);
camera.lookAt(scene.position);

/// Gesture object

var Gesture = function () {
  var active = false;
  Object.defineProperty(this, "active", {
    get: function () { return active },
    set: function (v) {
      return active = Boolean(v)
    }
  })
};
Gesture.prototype.clear = function () {
  this.geometry = new THREE.Geometry();
  this.acceleration = [];
  this.velocity = [];
  this.displacement = [];
  this.accelduration = [];
  this.orientation = [];
  this.orientduration = [];
  this._internals = {
    accel: new THREE.Vector3(0, 0, 0),
    accelPrev: new THREE.Vector3(0, 0, 0),
    deltaV: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    deltaD: new THREE.Vector3(0, 0, 0),
    displacement: new THREE.Vector3(0, 0, 0),
    accelduration: null,
    acceldurPrev: null,
    startTime: Date.now(),
    startFlag: true
  };
  this.geometry.vertices.push(this._internals.displacement)
};
Gesture.prototype.appendAccelData = function (d) {
  if (!this.active || d.constructor.name !== "Array") return false;
  this.acceleration.push(d);
  this.accelduration.push(Date.now() - this._internals.startTime);
  return d
};
Gesture.prototype.appendOrientData = function (d) {
  if (!this.active || d.constructor.name !== "Array") return false;
  this.orientation.push(d);
  this.orientduration.push(Date.now() - this._internals.startTime);
  return d
}
Gesture.prototype.constructor = Gesture;

var touch_down = false,
    touch = new THREE.Vector2(),
    touchPrev = new THREE.Vector2(),
    rotV = new THREE.Quaternion(),
    axis = new THREE.Vector3(),
    rot = new THREE.Quaternion(),
    adjq = new THREE.Quaternion(),
    rotationSensitivity = .00004,
    rotationDecay = .03;
var gpath, gesture = new Gesture();
addEvents({
  "": {
    devicemotion: function (e) {
      if (gesture.active) $("#acceldata").textContent = gesture.appendAccelData([e.acceleration.x, e.acceleration.y, e.acceleration.z])
    },
    deviceorientation: function (e) {
      if (gesture.active) $("#orientdata").textContent = gesture.appendOrientData([e.beta, e.gamma, e.alpha])
    },
    click: function () {
      document.body.classList.toggle("active");
      $("#acceldata, #orientdata").forEach(function (a) { a.classList.toggle("hide") });
      if (gesture.active) {
        var _ = gesture._internals;
        for (var i = 0; i < gesture.acceleration.length; i++) {
          _.acceldurPrev = _.accelduration || _.startTime;
          _.accelduration = gesture.accelduration[i];

          _.accel.set.apply(_.accel, gesture.acceleration[i]);
          _.deltaV.copy(_.accel).multiplyScalar((_.accelduration - _.acceldurPrev) / 1000);
          if (_.startFlag) _.velocity.sub(_.deltaV);
          _.velocity.add(_.deltaV);
          _.deltaD.copy(_.velocity).multiplyScalar((_.accelduration - _.acceldurPrev) / 1000);
          _.displacement.add(_.deltaD);

          gesture.velocity.push([_.velocity.x, _.velocity.y, _.velocity.z]);
          gesture.displacement.push([_.displacement.x, _.displacement.y, _.displacement.z]);
          _.startFlag = false;

          gesture.geometry.vertices.push(_.displacement.clone());
        }

        var o = scene.getObjectByName("gpath");
        scene.remove(o);

        var adjD,
            accel = new THREE.Vector3().copy(_.displacement)
              .multiplyScalar( 2 / Math.pow(_.accelduration / 1000, 2) );

        for (var i = 1; i < gesture.accelduration.length - 1; i++) {
          adjD = accel.clone().multiplyScalar( Math.pow(gesture.accelduration[i] / 1000, 2) / 2 );
          gesture.geometry.vertices[i+1].sub(adjD);
        }
        gesture.geometry.vertices[0].multiplyScalar(0);
        !gesture.accelduration.length || gesture.geometry.vertices[i+1].multiplyScalar(0);

        gpath = new THREE.Line( gesture.geometry, new THREE.LineBasicMaterial({ color: 0xffffff }) );
        gpath.name = "gpath";
        scene.add(gpath);
        render()
      } else {
        gesture.clear()
      }
      gesture.active = !gesture.active
    }
  },
  "#exportbutton": {
    click: function (e) {
      e.stopPropagation();
      if (gesture.active || !gesture.acceleration) return false;
      var blob = new Blob([JSON.stringify([
        gesture.acceleration, gesture.accelduration,
        gesture.orientation, gesture.orientduration
      ])], {type: 'text/plain'}); //application/json
      saveAs(blob, "gesture-" + Date.now() + '.txt');
    }
  }/*,
  "#renderer": {
    touchstart: function (event) {
      touchPrev.set(event.touches[0].pageX, event.touches[0].pageY);
      touch_down = true;
      if (Math.abs(rotV.x) < 1e-9 && Math.abs(rotV.y) < 1e-9 && Math.abs(rotV.z) < 1e-9) {
        rotV.set(1e-9, 1e-9, 1e-9, 1);
      }
      window.dispatchEvent(new Event("click"))
    },
    touchdown: function (event) {
      if (touch_down) {
        touch.set(event.touches[0].pageX, event.touches[0].pageY);
        axis.set(touch.y - touchPrev.y, touch.x - touchPrev.x, 0).applyQuaternion(adjq.copy(scene.quaternion).inverse());
        rot.setFromAxisAngle(axis, axis.length() / scene.scale.length() * rotationSensitivity).normalize();
        rotV.multiply(rot);
        touchPrev.copy(touch);
      }
    },
    touchend: function (event) {
      touch_down = false
    }
  }*/
})
var render = function () {
  /*scene.quaternion.multiply(rotV);
  rotV.slerp(adjq.set(0, 0, 0, 1), rotationDecay)
  renderer.render(scene, camera);
  if (gesture.active && Math.abs(rotV.x) > 1e-12 && Math.abs(rotV.y) > 1e-12 && Math.abs(rotV.z) > 1e-12) requestAnimationFrame(render);*/
  //if (gesture.active) requestAnimationFrame(render)
  renderer.render(scene, camera);
};
