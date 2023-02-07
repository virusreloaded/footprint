
import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';



let camera, scene, renderer, controls;
let cloudContainer = new THREE.Group();

const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;

let bloomComposer, finalComposer;

const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );

const params = {
	exposure: 0.6,
	bloomThreshold: 0,
	bloomStrength: 5.5,
	bloomRadius: 0.6,
	scene: 'Scene with Glow'
};

const darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
const materials = {};

let clock = new THREE.Clock();
let elapsedTime;

let bar = 0;
let barwidth = 250;

let model,model2, model3, model4;
let objectsToRotate = [];
let assets_loaded = false;
let isMoving = false;
let topPos = 0;

init();

function init() {

	const container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 200 );
	camera.position.set( 0, 0, 40 );

	scene = new THREE.Scene();
	// scene.fog = new THREE.Fog(0x28233A, 15, 150 );
	// scene.fog = new THREE.Fog(0xc72eab, 15, 150 );

	scene.fog = new THREE.FogExp2( 0xefd1b5, 0.0025 );


	THREE.DefaultLoadingManager.onProgress = function ( item, loaded, total ) {
		bar = Math.floor( barwidth * loaded / total );
		$("#bar").css("width", ""+bar+"px");
		// console.log(loaded/total);
		if (loaded/total == 1) {
			$('#progressbar').fadeOut('300');
			$( "#progress" ).fadeOut('300');
			$(".loader2").fadeOut("slow");
			animate();
			console.log(objectsToRotate)
		}
	};
	var onProgress = function ( xhr ) {
		if ( xhr.lengthComputable ) {
			//var percentComplete = xhr.loaded / xhr.total * 100;
			//console.log( Math.round(percentComplete, 2) + '% downloaded' );
		}
	};
	var onError = function ( xhr ) { };

	// model

	// new RGBELoader()
	// .setPath( 'tex/' )
	// .load( 'studio_den.hdr', function ( texture ) {

		// model

		scene.add(cloudContainer);

		const loader = new GLTFLoader().setPath( 'models/' );
		loader.load( 'cloud1.glb', function ( gltf ) {

			model = gltf.scene;
			model.rotation.y = Math.PI/180 * 90;
	
			model.traverse( function( node ) {
			
				node.layers.enable( BLOOM_SCENE );
				if ( node.name.includes('Shell') ) {
					objectsToRotate.push(node)
				}
				
			});
	
			cloudContainer.add( model );
			console.log(model)
	
		} );

		loader.load( 'cloud2.glb', function ( gltf ) {

			model2 = gltf.scene;
			model2.position.set(30,0,-50)
			model2.rotation.y = Math.PI/180 * 90;
	
			model2.traverse( function( node ) {

				node.layers.enable( BLOOM_SCENE );
				if ( node.name.includes('Shell') ) {
					objectsToRotate.push(node)
				}
				
			});
	
			cloudContainer.add( model2 );
			console.log(model2)
	
		} );

		loader.load( 'cloud3.glb', function ( gltf ) {

			model3 = gltf.scene;
			model3.position.set(0,0,-100)
			model3.rotation.y = Math.PI/180 * 90;
	
			model3.traverse( function( node ) {

				node.layers.enable( BLOOM_SCENE );
				if ( node.name.includes('Shell') ) {
					objectsToRotate.push(node)
				}
				
			});
	
			cloudContainer.add( model3 );
			console.log(model3)
	
		} );

		loader.load( 'cloud4.glb', function ( gltf ) {

			model4 = gltf.scene;
			model4.position.set(30,0,-150)
			model4.rotation.y = Math.PI/180 * 90;
	
			model4.traverse( function( node ) {

				node.layers.enable( BLOOM_SCENE );
			
				if ( node.name.includes('Shell') ) {
					objectsToRotate.push(node)
				}
				
			});
	
			cloudContainer.add( model4 );
			console.log(model4)
	
		} );



	const gui = new GUI();

	gui.add( params, 'scene', [ 'Scene with Glow', 'Glow only', 'Scene only' ] ).onChange( function ( value ) {

		switch ( value ) 	{

			case 'Scene with Glow':
				bloomComposer.renderToScreen = false;
				break;
			case 'Glow only':
				bloomComposer.renderToScreen = true;
				break;
			case 'Scene only':
				// nothing to do
				break;

		}

		render();

	} );

	const folder = gui.addFolder( 'Bloom Parameters' );

	folder.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {

		renderer.toneMappingExposure = Math.pow( value, 4.0 );
		render();

	} );

	folder.add( params, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {

		bloomPass.threshold = Number( value );
		render();

	} );

	folder.add( params, 'bloomStrength', 0.0, 10.0 ).onChange( function ( value ) {

		bloomPass.strength = Number( value );
		render();

	} );

	folder.add( params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

		bloomPass.radius = Number( value );
		render();

	} );

	const folder2 = gui.addFolder( 'Fog Parameters' );

	folder2.add( scene.fog, 'density', 0.0, 0.02 ).step( 0.001 ).onChange( function ( value ) {

		scene.fog.density = value;
		render();

	} );

	folder2.addColor(scene.fog, 'color').onChange( function(colorValue) {
		scene.fog.color.set(colorValue);
	});


	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( Math.min(window.devicePixelRatio,2) );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap
	renderer.toneMapping = THREE.ReinhardToneMapping;
	renderer.toneMappingExposure = Math.pow( params.exposure, 4.0 );
	renderer.outputEncoding = THREE.sRGBEncoding;
	container.appendChild( renderer.domElement );

	controls = new OrbitControls( camera, renderer.domElement );
	controls.addEventListener( 'change', render ); // use if there is no animation loop
	controls.minDistance = 0.1;
	controls.maxDistance = 100;
	controls.target.set( 0, 0, 0 );
	controls.update();

	
	const renderScene = new RenderPass( scene, camera );

	const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
	bloomPass.exposure = params.exposure;
	bloomPass.threshold = params.bloomThreshold;
	bloomPass.strength = params.bloomStrength;
	bloomPass.radius = params.bloomRadius;

	bloomComposer = new EffectComposer( renderer );
	bloomComposer.renderToScreen = false;
	bloomComposer.addPass( renderScene );
	bloomComposer.addPass( bloomPass );

	const finalPass = new ShaderPass(
		new THREE.ShaderMaterial( {
			uniforms: {
				baseTexture: { value: null },
				bloomTexture: { value: bloomComposer.renderTarget2.texture }
			},
			vertexShader: document.getElementById( 'vertexshader' ).textContent,
			fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
			defines: {}
		} ), 'baseTexture'
	);
	finalPass.needsSwap = true;

	finalComposer = new EffectComposer( renderer );
	finalComposer.addPass( renderScene );
	finalComposer.addPass( finalPass );

	window.addEventListener( 'resize', onWindowResize );

	$(window).scroll(function() {

		topPos = $(this).scrollTop();
		console.log(topPos)

		if (topPos > 50) {
			$('header').css('background-color','rgba(255,255,255,1');
			$('.main_menu a').css('color','rgba(0,0,0,1');
			$('.logo_main2').css('opacity','0');
			$('.logo_main').css('opacity','1');
		} else {
			$('header').css('background-color','rgba(255,255,255,0');
			$('.main_menu a').css('color','rgba(255,255,255,1');
			$('.logo_main2').css('opacity','1');
			$('.logo_main').css('opacity','0');
		}
	});

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	render();

}

function render() {

	switch ( params.scene ) {

		case 'Scene only':
			renderer.render( scene, camera );
			break;
		case 'Glow only':
			renderBloom( false );
			break;
		case 'Scene with Glow':
		default:

		// render scene with bloom
		renderBloom( true );

		// render the entire scene, then render bloom scene on top
		finalComposer.render();
		break;

	}

}

function renderBloom( mask ) {

	if ( mask === true ) {

		scene.traverse( darkenNonBloomed );
		bloomComposer.render();
		scene.traverse( restoreMaterial );

	} else {

		camera.layers.set( BLOOM_SCENE );
		bloomComposer.render();
		camera.layers.set( ENTIRE_SCENE );

	}

}

function darkenNonBloomed( obj ) {

if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {

		materials[ obj.uuid ] = obj.material;
		obj.material = darkMaterial;

	}

}

function restoreMaterial( obj ) {

if ( materials[ obj.uuid ] ) {

		obj.material = materials[ obj.uuid ];
		delete materials[ obj.uuid ];

	}

}

const moveCloudContainer = (x,y,z)=>{

	var cpA = {x: cloudContainer.position.x, y:cloudContainer.position.y, z:cloudContainer.position.z};
	var tpA = {x:x,y:y,z:z};

	var tween = new TWEEN.Tween(cpA).to(tpA, 1000);
	tween.easing(TWEEN.Easing.Quartic.Out);	
	tween.onUpdate(function () {

		cloudContainer.position.set(cpA.x, cpA.y, cpA.z);

	});
	tween.onComplete(function () {
		isMoving = false;
	});
	tween.start();
}

function animate() {

	elapsedTime = clock.getElapsedTime();

	if (topPos < 50) {
		if(!isMoving){
			isMoving = true;
			moveCloudContainer(0,0,0)
		}
	}
	if ((topPos > 750)&&(topPos < 1500)) {
		if(!isMoving){
			isMoving = true;
			moveCloudContainer(-30,0,50);
		}
	}

	if ((topPos > 1500)&&(topPos < 2250)) {
		if(!isMoving){
			isMoving = true;
			moveCloudContainer(0,0,100)
		}
	}

	if ((topPos > 2250)&&(topPos < 3000)) {
		if(!isMoving){
			isMoving = true;
			moveCloudContainer(-30,0,150)
		}
	}

	TWEEN.update();

	// camera.position.x += ( mouseX/5000 - camera.position.x ) * 0.05;
	// camera.position.y += ( - mouseY/10000 - camera.position.y ) * 0.05;

	for (let i=0;i<objectsToRotate.length;i++){
		objectsToRotate[i].rotation.y = elapsedTime * 0.1;
	}
	render();
	requestAnimationFrame( animate );
}