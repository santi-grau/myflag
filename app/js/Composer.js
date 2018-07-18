var EffectComposer = require('three-effectcomposer')(THREE);
// var UnrealBloomPass = require('./bloomPass');
// var ManualMSAARenderPass = require('./msaaPass');

var SimplexNoise = require( 'simplex-noise' );

var Composer = function( renderer, rendertarget, scene, camera ){
	EffectComposer.apply(this, arguments);

	this.time = 0;
	this.timeInc = 0.01;

	this.simplex = new SimplexNoise( Math.random );

	this.renderPass = new EffectComposer.RenderPass( scene, camera );
	this.addPass( this.renderPass);

	// this.msaaRenderPass = new THREE.ManualMSAARenderPass( scene, camera );
	// this.addPass( this.msaaRenderPass );
	// this.msaaRenderPass.sampleLevel = 2;
	// this.msaaRenderPass.unbiased = true;

	this.post = {
		uniforms: {
			'tDiffuse': { value: null },
			'amount': { value: rendertarget.width / 16 },
			'resolution': { value: new THREE.Vector2( rendertarget.width / 2, rendertarget.height / 2 ) },
			'time' : { value : Math.random() },
			'seed' : { value : new THREE.Vector2( Math.random(), Math.random() ) }
		},
		vertexShader: require('./../shaders/post.vs'),
		fragmentShader: require('./../shaders/post.fs')
	}

	this.postPass = new EffectComposer.ShaderPass( this.post );
	this.addPass( this.postPass );
	// this.postPass.renderToScreen = true;

	// this.bloomPass = new UnrealBloomPass( new THREE.Vector2( rendertarget.width / 2, rendertarget.height / 2 ), 0.5, 0.4, 0.1 ); // strength, radius, threshold;
	// this.addPass( this.bloomPass );

	// this.pixel = {
	// 	uniforms: {
	// 		'tDiffuse': { value: null },
	// 		'amount': { value: rendertarget.width / 64 },
	// 		'resolution': { value: new THREE.Vector2( rendertarget.width / 2, rendertarget.height / 2 ) },
	// 		'time' : { value : Math.random() },
	// 		'seed' : { value : new THREE.Vector2( Math.random(), Math.random() ) }
	// 	},
	// 	vertexShader: require('./../shaders/base.vs'),
	// 	fragmentShader: require('./../shaders/pixel.fs')
	// }

	// this.pixelPass = new EffectComposer.ShaderPass( this.pixel );
	// this.addPass( this.pixelPass );

	this.noise = {
		uniforms: {
			'tDiffuse': { value: null },
			'seed' : { value : new THREE.Vector2( Math.random(), Math.random() ) }
		},
		vertexShader: require('./../shaders/noise.vs'),
		fragmentShader: require('./../shaders/noise.fs')
	}

	this.noisePass = new EffectComposer.ShaderPass( this.noise );
	this.addPass( this.noisePass );
	this.noisePass.renderToScreen = true;
}

Composer.prototype = Object.create(EffectComposer.prototype);
Composer.prototype.constructor = Composer;

Composer.prototype.step = function( time ){
	this.time += this.timeInc;
	var noiseSignal = ( this.simplex.noise2D( Math.random(), this.time ) + 1 ) / 2;
	this.postPass.uniforms.time.value = Math.random() * 1000;
	if( noiseSignal > 0.75 ) this.postPass.enabled = true;
	else this.postPass.enabled = false;

	var postSignal = ( this.simplex.noise2D( this.time, 0.2 ) + 1 ) / 2;
	this.postPass.uniforms.seed.value = postSignal;

	this.noisePass.uniforms.seed.value = new THREE.Vector2( Math.random() * 1000, Math.random() * 1000 );

	// var bloomRadius = 0.2 + 0.4 * ( this.simplex.noise2D( Math.random(), this.time ) + 1 ) / 2;
	// var bloomStrength = 0.5;
	// var bloomSignal = ( this.simplex.noise2D( Math.random(), this.time ) + 1 ) / 2;
	// if( bloomSignal > 0.95 ) bloomRadius = 5 + 2 * ( this.simplex.noise2D( Math.random(), time ) + 1 ) / 2;
	// this.bloomPass.radius = bloomRadius;
	// this.bloomPass.strength = bloomStrength;

	this.render();
}

module.exports = Composer;