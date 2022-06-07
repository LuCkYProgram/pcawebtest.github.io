/* sweetScroll load */
document.addEventListener("DOMContentLoaded", function () {
  new SweetScroll({/* some options */});

  /* particlesJS.load(@dom-id, @path-json, @callback (optional)); */
  particlesJS('particles-js', {
    "particles": {
      "number": {
        "value": 30,
        "density": {
          "enable": true,
          "value_area": 800
        }
      },
      "color": {
        "value": "#008080"
      },
      "shape": {
        "type": "polygon",
        "stroke": {
          "width": 0,
          "color": "#000000"
        },
        "polygon": {
          "nb_sides": 5
        },
        "image": {
          "src": "img/github.svg",
          "width": 100,
          "height": 100
        }
      },
      "opacity": {
        "value": 0.5,
        "random": false,
        "anim": {
          "enable": false,
          "speed": 1,
          "opacity_min": 0.1,
          "sync": false
        }
      },
      "size": {
        "value": 3,
        "random": true,
        "anim": {
          "enable": false,
          "speed": 19.18081918081918,
          "size_min": 0.1,
          "sync": false
        }
      },
      "line_linked": {
        "enable": true,
        "distance": 150,
        "color": "#ffffff",
        "opacity": 0.4,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 4,
        "direction": "none",
        "random": true,
        "straight": false,
        "out_mode": "out",
        "bounce": false,
        "attract": {
          "enable": false,
          "rotateX": 600,
          "rotateY": 1200
        }
      },
      nb: 80
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": false,
          "mode": "grab"
        },
        "onclick": {
          "enable": true,
          "mode": "push"
        },
        "resize": true
      },
      "modes": {
        "grab": {
          "distance": 400,
          "line_linked": {
            "opacity": 1
          }
        },
        "bubble": {
          "distance": 400,
          "size": 40,
          "duration": 2,
          "opacity": 8,
          "speed": 3
        },
        "repulse": {
          "distance": 200,
          "duration": 0.4
        },
        "push": {
          "particles_nb": 4
        },
        "remove": {
          "particles_nb": 2
        }
      }
    },
    "retina_detect": true
  });

}, false);


import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r125/build/three.module.js";
import { TrackballControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r125/examples/jsm/controls/TrackballControls.js";
import { Lut } from "https://threejsfundamentals.org/threejs/resources/threejs/r125/examples/jsm/math/Lut.js";

// global variables needed for animation/interaction
let renderer;
let controls;
let camera;
let scene;
let cursor;
let raycaster;
let selectedSphere = null;
let dataList;

// entry point
init();
buildScene();
camera.position.set(50, 50, 50);
camera.lookAt(0, 0, 0);
animate();

function init() {
    const container = initContainer("threejs-container");
    renderer = initRenderer(container);
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 1, 600);
    controls = initControls(camera, renderer);
    cursor = new THREE.Vector2();
    cursor.set({ x: -99, y: 99 });
    container.addEventListener("pointermove", onCursorMove);
    raycaster = new THREE.Raycaster();
}

function initContainer(divId) {
    const div = document.getElementById(divId);
    return div;
}

function initRenderer(container) {
    const rend = new THREE.WebGLRenderer();
    rend.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(rend.domElement);
    return rend;
}

function initControls(camera, renderer) {
    const ctrl = new TrackballControls(camera, renderer.domElement);
    ctrl.rotateSpeed = 2.0;
    return ctrl;
}

async function readData(source="/assets/js/encoded_faces.json", colorMap="hot") {
    let jsonContent = await (await fetch(source)).json();
    let result = [];
    let minX = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    for (const name in jsonContent) {
        const info = jsonContent[name];
        const ele = {
            name: name,
            x: info["pca"][0],
            y: info["pca"][1],
            z: info["pca"][2],
            link: info["link"],
            b64: info["b64"],
        };
        if (ele.x < minX) { minX = ele.x; }
        if (ele.x > maxX) { maxX = ele.x; }
        result.push(ele);
    }

    // determine colors
    const lut = new Lut(colorMap, result.length);
    for (let i = 0; i < result.length; i++) {
        let xVal = (result[i].x - minX) / (maxX - minX);
        xVal = xVal * 0.8 + 0.1;
        result[i].color = lut.getColor(xVal);
    }

    return result;
}

async function buildScene() {
    scene = new THREE.Scene();

    const light = new THREE.DirectionalLight("white", 0.5);
    scene.add(light);

    const fog = new THREE.Fog("black", 0.1, 200);
    scene.fog = fog;

    dataList = await readData();
    const scalar = -100;
    for (let iData = 0; iData < dataList.length; iData++) {
        const data = dataList[iData];
        const geometry = new THREE.SphereGeometry(1, 64, 32);
        const material = new THREE.MeshStandardMaterial({ emissive: data.color, emissiveIntensity: 0.7 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.link = data.link;
        sphere.position.set(scalar * data.x, scalar * data.y, scalar * data.z);
        scene.add(sphere);
    }
}

function updateHovered() {
    if (selectedSphere) {
        const index = scene.children.indexOf(selectedSphere) - 1;

        const img = document.getElementById("hovered-img");
        img.src = dataList[index].b64;
        img.alt = dataList[index].name;

        const linkHref = document.getElementById("hovered-link");
        linkHref.href = dataList[index].link;

        const nameDiv = document.getElementById("hovered-name");
        nameDiv.innerText = dataList[index].name;

        const pcaDiv = document.getElementById("hovered-pca");
        pcaDiv.innerText = `PCA = (${dataList[index].x.toFixed(4)}, ${dataList[index].y.toFixed(4)}, ${dataList[index].z.toFixed(4)})`;
    }
}

function onCursorMove(event) {
    cursor.x = ((event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1;
    cursor.y = -((event.clientY - renderer.domElement.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;
}

function render() {
    // identify hover object
    raycaster.setFromCamera(cursor, camera);
    const intersects = raycaster.intersectObjects(scene.children, false);
    if (intersects.length > 0) {
        if (selectedSphere != intersects[0].object) {
            if (selectedSphere) { selectedSphere.material.emissiveIntensity = selectedSphere.prevEmissiveIntensity; }
            selectedSphere = intersects[0].object;
            selectedSphere.prevEmissiveIntensity = selectedSphere.material.emissiveIntensity;
            selectedSphere.material.emissiveIntensity = 1.5 * selectedSphere.material.emissiveIntensity;
        }
    } else {
        if (selectedSphere) { selectedSphere.material.emissiveIntensity = selectedSphere.prevEmissiveIntensity; }
        selectedSphere = null;
    }

    updateHovered();

    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
};