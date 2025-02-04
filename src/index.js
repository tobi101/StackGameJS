import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let stack = [],
    overhangs = [];
let boxSize = 3;
let height = 0;
let speed = 0.04;
let direction = new THREE.Vector3(1, 0, 0);
let gameOver = false;

init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(4, 10, 10); // Подняли камеру выше
    camera.lookAt(0, 0, 0); // Направили её на центр структуры

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;

    // Добавление источников света
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    startGame();

    window.addEventListener('click', placeBlock);
    window.addEventListener('resize', onWindowResize);
    animate();
}

function startGame() {
    // Удаляем все блоки
    stack.forEach(layer => scene.remove(layer.mesh));
    overhangs.forEach(overhang => scene.remove(overhang.mesh));

    stack = [];
    overhangs = [];
    height = 0;
    gameOver = false;

    addLayer(0, 0, boxSize, boxSize);
    addLayer(-boxSize, 0, boxSize, boxSize, 'x');

    animate(); // Перезапуск анимации
}

function addLayer(x, z, width, depth, axis) {
    if (gameOver) return;
    let y = height;
    let layer = generateBox(x, y, z, width, depth);
    stack.push(layer);
    if (axis) {
        layer.direction = axis;
    }
    height++;
}

function generateBox(x, y, z, width, depth) {
    let geometry = new THREE.BoxGeometry(width, 1, depth);
    let material = new THREE.MeshLambertMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()) });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return { mesh, width, depth, position: mesh.position };
}

function placeBlock() {
    if (gameOver) return;

    let topLayer = stack[stack.length - 1];
    let previousLayer = stack[stack.length - 2];
    let direction = topLayer.direction === 'x' ? 'x' : 'z';

    let delta = topLayer.position[direction] - previousLayer.position[direction];
    let overlap = previousLayer[direction === 'x' ? 'width' : 'depth'] - Math.abs(delta);

    if (overlap > 0) {
        let newWidth = direction === 'x' ? overlap : topLayer.width;
        let newDepth = direction === 'z' ? overlap : topLayer.depth;

        topLayer.mesh.scale.set(newWidth / topLayer.width, 1, newDepth / topLayer.depth);
        topLayer.mesh.position[direction] -= delta / 2;
        topLayer.width = newWidth;
        topLayer.depth = newDepth;

        let nextX = direction === 'x' ? topLayer.position.x : -boxSize;
        let nextZ = direction === 'z' ? topLayer.position.z : -boxSize;
        addLayer(nextX, nextZ, newWidth, newDepth, direction === 'x' ? 'z' : 'x');
    } else {
        gameOver = true;
        showGameOver();
    }
}

function showGameOver() {
    let gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'gameOverScreen';
    gameOverScreen.innerHTML = `<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);">
        <h2>Game Over!</h2>
        <p>Ваш счет: ${height - 2}</p>
        <button onclick="restartGame()" style="padding: 10px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">Играть снова</button>
    </div>`;
    document.body.appendChild(gameOverScreen);
}

function restartGame() {
    document.getElementById('gameOverScreen').remove();
    startGame();
}

function animate() {
    requestAnimationFrame(animate);
    if (!gameOver) {
        let topLayer = stack[stack.length - 1];
        if (topLayer.direction) {
            topLayer.position[topLayer.direction] += speed;
            if (topLayer.position[topLayer.direction] > boxSize || topLayer.position[topLayer.direction] < -boxSize) {
                speed = -speed;
            }
        }
    }
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.restartGame = restartGame;