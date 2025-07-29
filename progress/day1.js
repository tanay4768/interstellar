import './style.css'
import * as THREE from 'three'

const scene = new THREE.Scene()

const gemoetry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({ color: 0x0000ff })

const cube = new THREE.Mesh(gemoetry, material)
scene.add(cube)

const temp = {
  width: 1024,
  height: 720
}

const camera = new THREE.PerspectiveCamera(75, temp.width/temp.height)

const renderer = new THREE.WebGLRenderer()

renderer.setSize(temp.width, temp.height)

document.body.appendChild(renderer.domElement)

camera.position.z = 4;

renderer.render(scene, camera)