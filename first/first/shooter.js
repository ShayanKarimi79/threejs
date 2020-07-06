


window.addEventListener('resize',onWindowResize,false)
var scene,activeCamera,renderer,bulletCamera,controls,weapon,person,objects=[],targets=[],c;
var plane,planeNormal,surfaceMesh,mouse,bulletBody,bulletShape,personCamera,bottleShape,bottleBody,targetsBody=[],crates=[],cratesBody=[],crateShape;
var rayCaster,world,ammo,crate,crateBody;
var bullets=[],bulletsBody=[],halfCube,halfBottle, sound;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();

initCannon();
init()
animate()


function  initCannon(){

    world=new CANNON.World();
    world.quatNormalizeSkip=0;
    world.quatNormalizeFast=false;
    var solver=new CANNON.GSSolver();
    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRelaxation = 4;

    solver.iterations = 7;
    solver.tolerance = 0.1;
    var split = true;
    if(split)
        world.solver = new CANNON.SplitSolver(solver);
    else
        world.solver = solver;

    world.gravity.set(0,-20,0);
    world.broadphase = new CANNON.NaiveBroadphase();
    var physicsMaterial = new CANNON.Material("slipperyMaterial");
    var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
        physicsMaterial,
        0.0, // friction coefficient
        0.3  // restitution
    );
    // We must add the contact materials to the world
    world.addContactMaterial(physicsContactMaterial);
    // Create a plane
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    groundBody.position.set(0,0,0)
    world.add(groundBody);
    bulletShape = new CANNON.Cylinder(0.6,0.6,1,7);
    halfBottle=2.5
    bottleShape=new CANNON.Box(new CANNON.Vec3(halfBottle,halfBottle,halfBottle))
     halfCube=5.5
    crateShape=new CANNON.Box(new CANNON.Vec3(halfCube,halfCube,halfCube))



}

function init(){

    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.Type=THREE.PCFSoftShadowMap;
    renderer.setClearColor(new THREE.Color(0x000000))  ;
    renderer.setSize(window.innerWidth,window.innerHeight);
    scene=new THREE.Scene();
    mouse=new THREE.Vector2()

    //setting person
    person=new THREE.Group();
    person.position.set(200,40,-20)
    scene.add(person)

    //setting pointerLock control
    controls = new THREE.PointerLockControls( person, document.body );

    //setting bulletCamera
    bulletCamera=new THREE.PerspectiveCamera(35,window.innerWidth/innerHeight,0.001,100000);
    bulletCamera.position.set(15,5,-6)
    bulletCamera.lookAt(0,0,0)

    //setting personCamera
    personCamera=new THREE.PerspectiveCamera(35,window.innerWidth/innerHeight,0.001,100000);
    personCamera.lookAt(scene.position);
    personCamera.position.set(0,8,0)
    person.add(personCamera)
    activeCamera=personCamera
    var material = new THREE.LineBasicMaterial({ color: 0xAAFFAA });

// crosshair size
    var x = 0.005, y = 0.005;

    var geometry = new THREE.Geometry();

// crosshair
    geometry.vertices.push(new THREE.Vector3(0, y, 0));
    geometry.vertices.push(new THREE.Vector3(0, -y, 0));
    geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    geometry.vertices.push(new THREE.Vector3(x, 0, 0));
    geometry.vertices.push(new THREE.Vector3(-x, 0, 0));

    var crosshair = new THREE.Line( geometry, material );

// place it in the center
    var crosshairPercentX = 50;
    var crosshairPercentY = 50;
    var crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
    var crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;

    crosshair.position.x = crosshairPositionX * personCamera.aspect;
    crosshair.position.y = crosshairPositionY;

    crosshair.position.z = -0.3;

    personCamera.add( crosshair );

    var listener = new THREE.AudioListener();
    personCamera.add( listener );

// create a global audio source
     sound = new THREE.Audio( listener );

// loading gunfire sound
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'sounds/gunfire.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setVolume( 0.7 );
    });


    function onMouseMove(event) {
        event.preventDefault()
        mouse.x=(event.clientX/window.innerWidth)*2-1
        mouse.y=-(event.clientY/window.innerHeight)*2+1
    }
    var i=0;

    function onMouseDown() {
        var intersections = rayCaster.intersectObjects( objects,true );
       var onObject = intersections.length > 0;
        if (controls.isLocked && activeCamera===personCamera)
            shoot(weapon,ammo)
    }
    window.addEventListener('mousedown',onMouseDown,false)


    var onKeyDown = function ( event ) {

        switch ( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true;
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;


            case 48: controls.lock();activeCamera.position.set(0,5,0);break

        }

    };
    var onKeyUp = function ( event ) {

        switch ( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;
            case 32: // space
                if ( canJump === true ) velocity.y += 350;
                canJump = false;
                break;

        }

    };
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener("keyup",onKeyUp,false);
    rayCaster = new THREE.Raycaster();
    rayCaster.setFromCamera(mouse,activeCamera)
    var texture=new THREE.TextureLoader().load("textures/grass.jpg")
    texture.repeat.set(100,100)
    texture.wrapS=THREE.RepeatWrapping;
    texture.wrapT=THREE.RepeatWrapping;
    texture.magFilter=THREE.NearestFilter;
    texture.minFilter=THREE.LinearMipMapLinearFilter;

     var reflectionCube=new THREE.CubeTextureLoader().setPath("textures/").load(["meadow_ft.jpg","meadow_bk.jpg","meadow_up.jpg",
         "meadow_dn.jpg","meadow_rt.jpg","meadow_lf.jpg"])
    reflectionCube.format=THREE.RGBFormat;
     scene.background=reflectionCube

    var surfaceGeometry=new THREE.PlaneGeometry(1000,1000);
    var surfaceMaterial=new THREE.MeshPhongMaterial({color:0xffffff,side: THREE.DoubleSide,map:texture});
    surfaceMesh=new THREE.Mesh(surfaceGeometry,surfaceMaterial);
    surfaceMesh.rotateX(Math.PI/2)
    surfaceMesh.position.y=0;
    surfaceMesh.receiveShadow=true;
    scene.add(surfaceMesh)
    scene.fog=new THREE.Fog(0xffffff,0.1,600)



    var spotLight=new THREE.SpotLight(0x789abc)
    spotLight.angle=1;
    spotLight.penumbra=0.9
    spotLight.position.set(0,200,100);
    spotLight.lookAt(scene)
    spotLight.castShadow=true;
    spotLight.shadow.camera.near=0.5;
    spotLight.shadow.camera.far=1000;
    spotLight.shadow.mapSize.width=3000;
    spotLight.shadow.mapSize.height=2500;
    scene.add(spotLight);

    var ambientLight=new THREE.AmbientLight('#ffffff',0.8)
    scene.add(ambientLight)
    var pointLight=new THREE.PointLight(0xffffff,0.7)
    pointLight.position.set(0,50,100)
    pointLight.castShadow=true;



    document.getElementById("webgl-output").appendChild(renderer.domElement);
    window.addEventListener('mousemove',onMouseMove,false)

    //loading models

    var gltfLoader=new THREE.GLTFLoader();
    gltfLoader.load('./models/musket/scene.gltf',function (gltf) {
        weapon=gltf.scene;
        weapon.scale.set(0.5,0.5,0.5)
        weapon.position.set(2,4,-3);
        weapon.rotateY(Math.PI/2)
        person.add(weapon);


    });
    gltfLoader.load('./models/bullet9m/scene.gltf',function (gltf) {
        ammo=gltf.scene;

    });


    gltfLoader.load('./models/crate/scene.gltf',function (gltf) {
        var i,j;

        for (j=0;j<60;j+=20)
            for(i=-1*j;i<=j;i+=40)
            {   crate=gltf.scene.clone()
                crate.scale.set(0.2,0.2,0.2)
                crate.position.set(-20+j,0.1+halfCube,-20+i);
                crateBody=new CANNON.Body({mass:20})
                crateBody.addShape(crateShape);
                crateBody.position.copy(crate.position)


                world.add(crateBody)
                crate.traverse(function(child){
                    if (child.isMesh)
                    {
                        child.castShadow=true
                    }
                })
                scene.add(crate);
                crates.push(crate)

                cratesBody.push(crateBody)
            }
    });

    gltfLoader.load('./models/bottle4/scene.gltf',function (gltf) {
        var bottle,j;
        for(j=0;j<60;j+=20)
        for(i=-1*j;i<=j;i+=40)
        {   bottle=gltf.scene.clone()
            bottle.scale.set(0.5,0.5,0.5)
            bottle.position.set(-20+j,2*halfCube+halfBottle+30,-20+i);
            bottleBody=new CANNON.Body({mass:1})
            bottleBody.addShape(bottleShape);
            bottleBody.quaternion.copy(bottle.quaternion)
            bottleBody.position.copy(bottle.position)
            bottleBody.score=(60-j)*10
            targetsBody.push(bottleBody)
            targets.push(bottle)
            world.add(bottleBody)
            scene.add(bottle);
        }
    });




    function toggleBulletCamera(){

         var intersections = rayCaster.intersectObjects( targets,true );
          var onObject = intersections.length > 0;
          if (onObject)
              alert("true")
    }



    function shoot(src,ammo){


        var bullet=ammo.clone();
        bullet.scale.set(1,0.4,0.4)
        bullet.direction= new THREE.Vector3();
        var source=new THREE.Vector3();
        personCamera.getWorldDirection(bullet.direction)

        bullet.lookAt(bullet.direction)
        bullet.rotateY(-Math.PI/2)
        src.getWorldPosition( source)
        bullet.position.copy(source);
        scene.add(bullet)
        bullets.push(bullet)
        bullet.add(bulletCamera)
        activeCamera=bulletCamera

        //setting bulletBody
        bulletBody = new CANNON.Body({ mass: 0.1 });
        bulletBody.addShape(bulletShape);
        bulletBody.addEventListener('collide',onCollide)
        bulletBody.position.copy(source)
        bulletBody.quaternion.copy(bullet.quaternion)
        var shootVelo=800;
        bulletBody.velocity.set(  bullet.direction.x * shootVelo,
            bullet.direction.y * shootVelo,
            bullet.direction.z * shootVelo);
        world.add(bulletBody)
        bulletsBody.push(bulletBody)
        sound.play()


    }
}
var removes=[];
function  onCollide(e) {
    this.removeEventListener('collide',onCollide)
    removes.push(this)
    if (targetsBody.indexOf(e.body)>-1&&e.body.score>0)
    {
        var elem=document.getElementById("score")
        elem.innerText=String(parseInt(elem.innerHTML)+e.body.score);

    }
    activeCamera=personCamera

}


var dt = 1/60;
function animate() {
    requestAnimationFrame(animate)
    rayCaster.setFromCamera(mouse,activeCamera)

    if ( controls.isLocked === true ) {

        rayCaster.ray.origin.copy( controls.getObject().position );
        rayCaster.ray.origin.y -= 10;
        world.step(dt);
        if (removes!=[])
        {removes.forEach(function (temp) {
            var index=bulletsBody.indexOf(temp)
            if(index>-1) {
                scene.remove(bullets[index])
                world.remove(bulletsBody[index])
                bulletsBody.splice(index, 1)
                bullets.splice(index, 1)
            }
        })

        }


        for(var i=0; i<bulletsBody.length; i++){
            bullets[i].position.copy(bulletsBody[i].position);
            bullets[i].quaternion.copy(bulletsBody[i].quaternion);
        }
       for(var i=0; i<cratesBody.length; i++){
            crates[i].position.copy(cratesBody[i].position);
            crates[i].position.y-=(halfCube+0.1)
           crates[i].quaternion.copy(cratesBody[i].quaternion);
        }
        for(var i=0; i<targetsBody.length; i++){
            targets[i].position.copy(targetsBody[i].position);
            targets[i].quaternion.copy(targetsBody[i].quaternion);
        }




        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); // this ensures consistent movements in all directions

        if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;



        controls.moveRight( - velocity.x * delta );
        controls.moveForward( - velocity.z * delta );

        controls.getObject().position.y += ( velocity.y * delta ); // new behavior

        if ( controls.getObject().position.y < 10 ) {

            velocity.y = 0;
            controls.getObject().position.y = 10;

            canJump = true;

        }

        prevTime = time;

    }

    var t=Date.now()/1000
   /* planeBasic.position.y=Math.sin(t+1)*10+30
    planePhong.position.y=Math.sin(t+1.5)*10+30*/





    renderer.render(scene,activeCamera)

}


function onWindowResize(){
    activeCamera.aspect=window.innerWidth/window.innerHeight
    activeCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight)
}
//window.onload=init