window.THREE = require('three');
window.GSAP = require('gsap');

var Chroma = require('chroma-js')

var Composer = require('./Composer');


var Main = function( ) {
	this.node = document.getElementById('main');

	this.time = 0;
	this.timeInc = 0.01;
	this.scale = 0;

	this.scene = new THREE.Scene();
	this.camera = new THREE.OrthographicCamera();
	this.renderer = new THREE.WebGLRenderer( { alpha : true, antialias : true } );
	this.node.appendChild( this.renderer.domElement );


	this.postRT = new THREE.WebGLRenderTarget( this.node.offsetWidth * 2, this.node.offsetHeight * 2, {  } );
	this.composer = new Composer( this.renderer, this.postRT, this.scene, this.camera );
	this.zoom = 1.4;
	window.addEventListener( 'resize', this.resize.bind( this ) );

	this.col = Chroma( Math.random( ) * 360, Math.random( ) * 0.2 + 0.8, 0.5, 'hsl' );
	var c = this.col.gl()

	var v = this.col.hsl()[0];
	var v2;
	if( v < 180) v2 = v + 180;
	else v2 = v - 180;

	var c2 = Chroma( v2, this.col.hsl()[1], this.col.hsl()[2], 'hsl' ).gl();

	this.group = new THREE.Group();
	
	var mat = new THREE.ShaderMaterial({
		uniforms : {
			time : { value : Math.random() },
			seed : { value : Math.random() },
			color : { value : new THREE.Vector3( c[0], c[1], c[2] ) },
			color2 : { value : new THREE.Vector3( c2[0], c2[1], c2[2] ) }
		},
		vertexShader: require('./../shaders/liquid.vs'), 
		fragmentShader: require('./../shaders/liquid.fs'),
		transparent : true
	});
	var geo = new THREE.OctahedronBufferGeometry( 20, 5	);
	this.group.add( new THREE.Mesh( geo, mat ) );
	this.group.children[ 0 ].scale.set( 6, 6, 6 );
	this.group.rotation.y = Math.PI / 2;
	this.group.rotation.x = Math.PI / 2;


	var texture = new THREE.TextureLoader().load( 'img/bg.png' );
	var geometry = new THREE.PlaneGeometry( 1, 1 );
	var material = new THREE.MeshBasicMaterial( { map : texture } );
	this.bg = new THREE.Mesh( geometry, material );
	this.bg.position.z = -1000;
	this.scene.add( this.bg );

	var texture = new THREE.TextureLoader().load( 'img/claim2n.png' );
	var geometry = new THREE.PlaneGeometry( 300, 300 );
	var material = new THREE.MeshBasicMaterial( { map : texture, transparent : true } );
	this.plane = new THREE.Mesh( geometry, material );
	this.plane.position.z = 20;
	this.scene.add( this.plane );
	
	setInterval( this.shift.bind( this ), 5000 );
	this.scene.add( this.group );
	
	this.resize();
	
	this.capture = false;

	if( this.capture ){
		this.capturer = new CCapture( {
			verbose: false,
			display: true,
			framerate: 60,
			motionBlurFrames: 0,
			quality: 100,
			format: 'webm',
			workersPath: './js/',
			timeLimit: 20,
			frameLimit: 1200,
			autoSaveTime: 0,
			onProgress: function( p ) {  }
		} );
		this.capturer.start();
	}

	this.step();

	
}

Main.prototype.shift = function(){

	// if( this.capture ) this.capturer.stop();
	// if( this.capture ) this.capturer.save();

	var c = Chroma( Math.random( ) * 360, Math.random( ) * 0.2 + 0.8, 0.5, 'hsl' );
	var scale = Chroma.scale( [ this.col, c ] ).mode( 'lch' );

	this.scale = 0;

	TweenLite.to( this, 1.2, { scale : 1, ease : Power4.easeOut, delay : 2,
		onUpdateParams:[this.scale] ,
		onUpdate: function(){

			var c = Chroma( scale( this.scale ) );

			this.group.children[0].material.uniforms.color.value = new THREE.Vector3( c.gl()[0], c.gl()[1], c.gl()[2] );
			
			var v = c.hsl()[0];
			var v2;
			if( v < 180) v2 = v + 180;
			else v2 = v - 180;

			var c2 = Chroma( v2 , c.hsl()[1], c.hsl()[2], 'hsl' ).gl();
			this.group.children[0].material.uniforms.color2.value = new THREE.Vector3( c2[0], c2[1], c2[2] );
		}.bind( this ),
		onComplete: function(){
			this.col = c;
		}.bind( this ),
	} );
}

Main.prototype.resize = function( e ) {
	var width = this.node.offsetWidth, height = this.node.offsetHeight;

	var camView = { left : width / -2, right : width / 2, top : height / 2, bottom : height / -2 };
	for ( var prop in camView) this.camera[ prop ] = camView[ prop ];
	this.camera.position.z = 1000;	
	this.renderer.setSize( width * 2, height * 2 );
	this.renderer.domElement.setAttribute( 'style', 'width:' + width + 'px; height:' + height + 'px;' );
	this.camera.zoom = this.zoom;	
	this.camera.updateProjectionMatrix( );

	this.bg.scale.set( width / this.zoom, height / this.zoom, 1 )
}

Main.prototype.step = function( time ) {
	window.requestAnimationFrame( this.step.bind( this ) );
	this.time += this.timeInc;

	this.group.children[0].material.uniforms.seed.value += 0.003;
	this.group.children[0].material.uniforms.time.value += 0.01;
	this.group.rotation.x -= 0.005;
	this.group.rotation.y -= 0.005;
	this.group.rotation.z += 0.005;

	this.plane.rotation.z -= 0.002

	// this.renderer.render( this.scene, this.camera );
	this.composer.step( time )

	if( this.capture ) this.capturer.capture( this.renderer.domElement );
};

var root = new Main();