import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { sRGBEncoding} from 'three'

//* LOADERS
const gltfLoader = new GLTFLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()


/**
 * Base
 */
// Debug
const gui = new dat.GUI()
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//* UPDATE ALL MATERIALS

//* Hard way. targeting specific elements to apply the environment to, in this case, all Mesh with MeshStandardMaterial.
const updateAllMaterials = () => 
{
    scene.traverse((child) => 
    {
        console.log(child)

        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            //child.material.envMap = environmentMap
            child.material.envMapIntensity = debugObject.envMapIntensity 
            child.material.needsUpdate = true // updated from gui value, then (step 2), update all materials, renderer. line 154.
            child.castShadow = true
            child.receiveShadow = true
        }
    })
}

//* Environment Map
const environmentMap = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.jpg',
    '/textures/environmentMaps/0/nx.jpg',
    '/textures/environmentMaps/0/py.jpg',
    '/textures/environmentMaps/0/ny.jpg',
    '/textures/environmentMaps/0/pz.jpg',
    '/textures/environmentMaps/0/nz.jpg'
])
environmentMap.encoding = THREE.sRGBEncoding // Change to sRGBencoding, default was linear encoding
scene.background = environmentMap
scene.environment = environmentMap //* EASY WAY


debugObject.envMapIntensity = 2
gui.add(debugObject, 'envMapIntensity').min(0).max(10).step(0.001).onChange(updateAllMaterials)


//* Models
gltfLoader.load('/models/FlightHelmet/glTF/FlightHelmet.gltf', 
(gltf) => 
{
    gltf.scene.scale.set(10, 10, 10)
    gltf.scene.position.set(0, -4, 0)
    gltf.scene.rotation.y = Math.PI * 0.5

    scene.add(gltf.scene)
    console.log(gltf)

    gui.add(gltf.scene.rotation, 'y')
    .min(- Math.PI)
    .max(Math.PI)
    .step(0.001)
    .name('rotation')

    updateAllMaterials()
})


//* Direction Light

const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
directionalLight.position.set(0.25, 3, -2.25)
directionalLight.castShadow = true // this is step 2, then activate the shadows on meshes
directionalLight.shadow.camera.far = 10 // Decrease shadow scannning area for performance increase.
directionalLight.shadow.mapSize.set(1024, 1024) // increase resolution of shadows
//directionalLight.shadow.normalBias = 0.05 //* Use this to fix shadow acne, shadow falling on the surface of the mesh, the bias makes the mesh shadow catching area smaller while keep ing the mesh the same. start with small values and move up until fixed.

scene.add(directionalLight)

// const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)

// scene.add(directionalLightCameraHelper)

gui.add(directionalLight, 'intensity').min(0).max(10).step(0.001).name('lightIntensity')
gui.add(directionalLight.position, 'x').min(-5).max(5).step(0.001).name('lightX')
gui.add(directionalLight.position, 'y').min(-5).max(5).step(0.001).name('lightY')
gui.add(directionalLight.position, 'z').min(-5).max(5).step(0.001).name('lightZ')


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.001, 100)
camera.position.set(4, 1, - 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true //Stair-like effect on edges removed using Multi-sampling. Super Sampling divides pixels by 4, not performant.
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.physicallyCorrectLights = true //* REALISTIC LIGHT RATIO FROM BLENDER
renderer.outputEncoding = THREE.sRGBEncoding //* REALISTIC LIGHT OUTPUT ENCODING, change the envirnment loaded imgs to sRGB encoding, don't use sRGB on other textures like normal, height etc.. , only visible textures
renderer.toneMapping = THREE.ACESFilmicToneMapping
//* Different kinds of tone mapping (Light scale from HDR to binary)
// THREE.NoToneMApping(default)
// THREE.LinearToneMapping
// THREE.ReinhardToneMapping
// THREE.CineonToneMapping
// THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 2 // More light
renderer.shadowMap.enabled = true // Enable Shadows, then enable on lights section
renderer.shadowMap.type = THREE.PCFSoftShadowMap // ShadowMap type

gui.add(renderer, 'toneMapping', {
    None: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    Filmic: THREE.ACESFilmicToneMapping
}).onFinishChange(updateAllMaterials) // then (step1) tell materials to update - line 39

gui.add(renderer, 'toneMappingExposure').min(0).max(10).step(0.001)
/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()