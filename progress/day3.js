// Import necessary Three.js modules from local packages
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

// Import post-processing modules for the glow effect
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

function main() {
    // --- 1. BASIC SETUP ---
    // Get the canvas element from the HTML
    const canvas = document.querySelector('#c');
    // Create the WebGL renderer, which will draw the scene on the canvas. 
    // 'antialias: true' makes the edges of objects smoother.
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.toneMapping = THREE.ReinhardToneMapping; // A tone mapping algorithm for better color and light representation

    // --- 2. CAMERA SETUP ---
    // A PerspectiveCamera mimics how the human eye sees.
    const fov = 45; // Field of View: how wide the camera's view is in degrees.
    const aspect = 2; // Aspect Ratio: the canvas width divided by its height.
    const near = 0.1; // Near Clipping Plane: objects closer than this won't be rendered.
    const far = 100; // Far Clipping Plane: objects further than this won't be rendered.
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20); // Set the camera's starting position.

    // --- 3. ORBIT CONTROLS ---
    // OrbitControls allow the user to rotate, pan, and zoom the camera with the mouse.
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0); // The point the camera will orbit around.
    controls.update(); // Must be called after any manual changes to the camera's transform.

    // --- 4. SCENE SETUP ---
    // The scene is the container for all our 3D objects, lights, and cameras.
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('black'); // Set the background color.

    // --- 5. LIGHTING ---
    // Add a simple light to give the spheres some definition.
    const light = new THREE.DirectionalLight(0xffffff, 3); // White light, full intensity.
    light.position.set(-1, 2, 4); // Position the light.
    scene.add(light);

    // --- 6. SPHERE CREATION ---
    // We will create multiple spheres and store them in an array to animate them later.
    const spheres = [];
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32); // A sphere with a radius of 1.

    // An array of colors for our spheres.
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00]; // Red, Green, Blue, Yellow

    const numSpheres = 4;
    const radius = 5; // The radius of the circle the spheres will orbit on.
    const yPosition = 5; // The height of the spheres.

    for (let i = 0; i < numSpheres; i++) {
        // Create a NEW material for each sphere. This is important so each can have a unique color.
        // We use MeshStandardMaterial which reacts to light.
        // The 'emissive' property makes the material glow. The bloom pass will enhance this glow.
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: colors[i],
            emissive: colors[i], // The color of the glow
            emissiveIntensity: 1, // How strong the glow is
        });

        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        
        // Calculate the initial position in a circle
        const angle = i * (Math.PI * 2) / numSpheres;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        sphere.position.set(x, yPosition, z);

        scene.add(sphere);
        spheres.push(sphere); // Add the sphere to our array for animation.
    }

    // --- 7. POST-PROCESSING (GLOW EFFECT) ---
    // To create a glow effect, we use a technique called post-processing.
    // Instead of rendering directly to the screen, we render to an offscreen buffer
    // and apply effects (like bloom) before drawing the final image.

    // The EffectComposer manages a chain of post-processing passes.
    const composer = new EffectComposer(renderer);

    // The RenderPass renders the original scene. It's usually the first pass.
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // The UnrealBloomPass creates the glowing effect.
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, // strength
        0.4, // radius
        0.85 // threshold
    );
    composer.addPass(bloomPass);
    
    // The OutputPass ensures the final image is correctly displayed. It should be the last pass.
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // --- 8. GUI (GRAPHICAL USER INTERFACE) ---
    // lil-gui is a simple library to create panels with sliders and buttons to control variables.
    const gui = new GUI();
    
    // This object will hold the parameters we want to control with the GUI.
    const params = {
        rotationSpeed: 0.5,
        // Bloom parameters
        bloomThreshold: 0.85,
        bloomStrength: 1.5,
        bloomRadius: 0.4,
    };

    // Add sliders to the GUI panel.
    gui.add(params, 'rotationSpeed', 0, 2, 0.01).name('Rotation Speed');
    
    const bloomFolder = gui.addFolder('Glow (Bloom)');
    bloomFolder.add(params, 'bloomThreshold', 0.0, 1.0, 0.01).onChange((value) => {
        bloomPass.threshold = Number(value);
    });
    bloomFolder.add(params, 'bloomStrength', 0.0, 3.0, 0.01).onChange((value) => {
        bloomPass.strength = Number(value);
    });
    bloomFolder.add(params, 'bloomRadius', 0.0, 1.0, 0.01).onChange((value) => {
        bloomPass.radius = Number(value);
    });


    // --- 9. RESPONSIVE DESIGN ---
    // This function handles resizing the browser window.
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
            composer.setSize(width, height); // Also resize the composer
        }
        return needResize;
    }

    // --- 10. ANIMATION LOOP ---
    // We use a clock to get the elapsed time, which helps in creating smooth, frame-rate-independent animations.
    const clock = new THREE.Clock();

    function render() {
        // Check if the window was resized and update camera/renderer if so.
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        
        // Get the time elapsed since the clock started.
        const time = clock.getElapsedTime();

        // Animate the spheres
        spheres.forEach((sphere, i) => {
            // The initial angle offset for each sphere.
            const initialAngle = i * (Math.PI * 2) / numSpheres;
            // Update the angle over time based on rotationSpeed.
            const angle = initialAngle + time * params.rotationSpeed;
            
            // Calculate the new X and Z positions to make them orbit.
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            sphere.position.set(x, yPosition, z);
        });

        // Instead of renderer.render(), we call composer.render() to apply the post-processing effects.
        composer.render();

        // This creates a loop, calling the render function before the next frame is drawn.
        requestAnimationFrame(render);
    }

    // Start the animation loop.
    requestAnimationFrame(render);
}

main();