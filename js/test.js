
var scene;
var camera;
var renderer;

var controls;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var plane = new THREE.Plane();
var guiPlane = new THREE.Plane();
var planeNormal = new THREE.Vector3();
var control_points = [];

var gui = new dat.GUI();
var selectedPoint;
var options = {
  tension: 0.0,
  clean: function() {
    control_points = [];
    hermDerivatives = [];
    hermiteStateNum = 0;
    arrowAdded = false;
    arrows = [];
    hermiteState = false; 
    while(scene.children.length > 0) { 
      scene.remove(scene.children[0]);      
    }
  },
  bezier: function() {
    drawCurve(bezier, control_points);
  },
  hermite: function() {
    hermiteState = true;
  },
  catmullrom: function() {
    drawCurve(catmullrom, control_points);
  }
};
gui.add(options, 'clean');
gui.add(options, 'bezier');
gui.add(options, 'hermite');
gui.add(options, 'catmullrom');
gui.add(options, 'tension', 0, 1).listen();
var init = function() {

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    // controls = new THREE.OrbitControls(camera, renderer.domElement);
    // document.body.appendChild( renderer.domElement );
    document.getElementById("scene").appendChild(renderer.domElement);
    document.getElementById("scene").addEventListener("mousedown", onMouseDown, false);
    document.getElementById("scene").addEventListener("mousemove", onMouseMove, false);

    this.render();

};


var render = function() {
    requestAnimationFrame( render ); 
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.render( scene, camera );
};

function factorial(n) {
  if (n == 0 || n == 1)
    return 1;
  return n*factorial(n-1);
}

function combination(k, i) {
  return factorial(k)/(factorial(k-i)*factorial(i));
}

function bezier(cpoints) {
  points = []
  k = cpoints.length-1; // grau da curva
  for (u = 0; u <= 1; u += 0.01) {
    p = new THREE.Vector2();    
    for ( i = 0; i < k+1; i++) {
      cp = new THREE.Vector2();
      cp.x = cpoints[i].x;
      cp.y = cpoints[i].y;
      p = p.add(cp.multiplyScalar(combination(k, i) * Math.pow((1-u), k-i) * Math.pow(u, i)));
    }
    points.push(p);
  }
  return points;
}

var hermiteState = false;
function hermite(cpoints) { 
  p1 = new THREE.Vector2(cpoints[0].x, cpoints[0].y);
  d1 = new THREE.Vector2(cpoints[1].x, cpoints[1].y);
  p2 = new THREE.Vector2(cpoints[2].x, cpoints[2].y);
  d2 = new THREE.Vector2(cpoints[3].x, cpoints[3].y);
  points = [];  
  for (u = 0; u <= 1; u += 0.01) {    
    p = new THREE.Vector2(0, 0);
    h1 = 1 - 3*Math.pow(u, 2) + 2*Math.pow(u, 3);
    h2 = u - 2*Math.pow(u, 2) + Math.pow(u, 3);
    h3 = 3*Math.pow(u, 2) - 2*Math.pow(u, 3);
    h4 = Math.pow(u, 3) - Math.pow(u, 2);
    p.add(p1.clone().multiplyScalar(h1));
    p.add(d1.clone().multiplyScalar(h2));
    p.add(p2.clone().multiplyScalar(h3));
    p.add(d2.clone().multiplyScalar(h4));
    points.push(p);
  }         
  return points;
}

function catmullrom(cpoints) {
  t = options.tension;
  var p1 = new THREE.Vector2(cpoints[1].x, cpoints[1].y);
  var d1 = new THREE.Vector2(cpoints[2].x-cpoints[0].x, cpoints[2].y-cpoints[0].y);  
  d1 = d1.clone().multiplyScalar(0.5);
  var p2 = new THREE.Vector2(cpoints[2].x, cpoints[2].y);  
  var d2 = new THREE.Vector2(cpoints[3].x-cpoints[1].x, cpoints[3].y-cpoints[1].y);
  d2 = d2.clone().multiplyScalar(0.5);

  points = [];
  for (u = 0; u <= 1; u += 0.01) {    
    p = new THREE.Vector2(0, 0);
    // h1 = 1;
    // h2 = 2*s*u;
    // h3 = 2*s*Math.pow(u,2) + (s-3)*Math.pow(u, 2) + (3-2*s)*Math.pow(u, 2);
    // h4 = - s*Math.pow(u, 3) + (2-s)*Math.pow(u, 3) - (s-2)*Math.pow(u, 3) + s*Math.pow(u, 3);
    // h1 = 0 - s*u + 2*s*Math.pow(u,2) - s*Math.pow(u, 3);
    // h2 = 1 + 0 + (s-3)*Math.pow(u, 2) + (2-s)*Math.pow(u, 3);
    // h3 = 0 + s*u + (3-2*s)*Math.pow(u, 2) - (s-2)*Math.pow(u, 3);
    // h4 = 0 + 0 - s*Math.pow(u, 3) + s*Math.pow(u, 3);
    h1 = 1 - 3*Math.pow(u, 2) + 2*Math.pow(u, 3);
    h2 = u - 2*Math.pow(u, 2) + Math.pow(u, 3);
    h3 = 3*Math.pow(u, 2) - 2*Math.pow(u, 3);
    h4 = Math.pow(u, 3) - Math.pow(u, 2);
    p.add(p1.clone().multiplyScalar(h1));
    p.add(d1.clone().multiplyScalar(h2));
    p.add(p2.clone().multiplyScalar(h3));
    p.add(d2.clone().multiplyScalar(h4));
    
    points.push(p);
  }
  return points;
}

// draw curve
function drawCurve(blending, cpoints) {
    points = blending(cpoints);
    for (p of points) {
      p3d = new THREE.Vector3(p.x, p.y, 0);
      setPoint(p3d);
    }    
}

function drawPoints(points) {
  for (p of points) {
    p3d = new THREE.Vector3(p.x, p.y, 0);
    setPoint(p3d);
  } 
}

function getPoint(event) {
    var point = new THREE.Vector3();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    planeNormal.copy(camera.position).normalize();
    plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);
    raycaster.setFromCamera(mouse.clone(), camera);
    raycaster.ray.intersectPlane(plane, point);    
    return point;
  }
  
  function setPoint(position) {
    var sphere = new THREE.Mesh(new THREE.SphereBufferGeometry(.01, 4, 2), new THREE.MeshBasicMaterial({
      color: "blue",
      wireframe: true
    }));
    sphere.position.copy(position);
    scene.add(sphere);
  }

  function finishHermite() {
    hermiteState = false;
    hermPoints = [];
    j = 0;
    for(i = 0; i < control_points.length-2; i++) {
      for (j = i; j < i+2; j++) {
        hermPoints.push(control_points[j]);
        hermPoints.push(control_points[j+control_points.length/2]);
      }
      drawCurve(hermite, hermPoints);
      hermPoints = [];                    
    }
  }
  
  var count = 0;
  function onMouseDown(event) {
    if (document.activeElement.id != "corpo") { // resolve o problema do raycasting atingir a GUI
      return;
    }
    if (hermiteState) {
      hermiteStateNum++;
      control_points.push(dir);
      arrowAdded = false;      
      if (hermiteStateNum > (control_points.length-1)/2) {
        finishHermite();        
      }
      return;
    }
    point = getPoint(event);
    control_points.push(new THREE.Vector2(point.x, point.y));
    setPoint(point);
  }
  
  var arrowHelper;
  var dir;
  var arrowAdded = false;
  var hermiteStateNum = 0; // control point que será usado para pegar a derivada
  function onMouseMove(event) {
    if (hermiteState) {
      var edge = getPoint(event);
      var origin = control_points[hermiteStateNum];
      origin = new THREE.Vector3(origin.x, origin.y, 0);
      dir = edge.clone().sub(origin);
  
      if (!arrowAdded) {        
        arrowAdded = true;
        length = 1;
        var hex = 0xffff00;    
        arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );        
        scene.add( arrowHelper );
      }
      else {
        arrowHelper.setDirection(dir);
      }
    }
  }

window.onload = this.init;