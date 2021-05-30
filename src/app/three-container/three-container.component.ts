import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

// ('collision-box');
window.THREE = THREE;
@Component({
  selector: 'app-three-container',
  templateUrl: './three-container.component.html',
  styleUrls: ['./three-container.component.scss'],
})
export class ThreeContainerComponent implements OnInit {
  constructor() {}

  @ViewChild('canvasContainer') canvasContainer: ElementRef;

  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(
    window.innerWidth / -2,
    window.innerWidth / 2,
    window.innerHeight / 2,
    window.innerHeight / -2,
    1,
    1000
  );

  private renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  private geometry = new THREE.BoxGeometry(4, 4, 4);
  private material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5,
  });
  private innerBox = new THREE.Mesh(this.geometry, this.material);
  private box: THREE.Group = null;
  private readonly GLTFLoader = new GLTFLoader();
  private readonly OBJLoader = new OBJLoader();
  private actionList = [];
  private mixerList = [];
  private readonly clock = new THREE.Clock();

  // private controls: THREE.PointerLockControls = null;
  private moveForward: boolean;
  private moveLeft: boolean;
  private moveBackward: boolean;
  private moveRight: boolean;
  private canJump: boolean;
  private spaceUp: boolean = true;
  private readonly upSpeed = 2; //控制跳起时的速度
  private readonly G = 0.2;
  private objList = [];

  private velocity = new THREE.Vector3(); //移动速度变量

  private readonly horizontalRaycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(),
    0,
    2
  );
  private readonly downRaycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    2
  );
  private footerVector3List: THREE.Vector3[] = [
    new THREE.Vector3(2, 0, -2),
    new THREE.Vector3(2, 0, 2),
    new THREE.Vector3(-2, 0, -2),
    new THREE.Vector3(-2, 0, 2),
  ];

  @HostListener('window:resize', ['$event'])
  onResize() {
    // this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp': // up
      case 'w': // w
        this.moveForward = true;
        break;
      case 'ArrowLeft': // left
      case 'a': // a
        // this.moveLeft = true;
        break;
      case 'ArrowDown': // down
      case 's': // s
        this.moveBackward = true;
        break;
      case 'ArrowRight': // right
      case 'd': // d
        // this.moveRight = true;
        break;
      case ' ': // space
        if (this.canJump && this.spaceUp) {
          this.velocity.y += this.upSpeed;
        }
        this.canJump = false;
        this.spaceUp = false;
        break;
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp': // up
      case 'w': // w
        this.moveForward = false;
        break;
      case 'ArrowLeft': // left
      case 'a': // a
        this.moveLeft = false;
        break;
      case 'ArrowDown': // down
      case 's': // s
        this.moveBackward = false;
        break;
      case 'ArrowRight': // right
      case 'd': // d
        this.moveRight = false;
        break;
      case ' ': // space
        this.spaceUp = true;
        break;
    }
  }

  ngOnInit(): void {
    this.init();
  }

  private async init() {
    await this.canvasContainer;

    // 參數為座標軸長度
    const axes = new THREE.AxesHelper(30);
    axes.position.y = 0;
    this.scene.add(axes);
    this.camera.position.x = -10;
    this.camera.position.y = 10;
    this.camera.position.z = 10;
    this.camera.zoom = 10;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    const light = new THREE.HemisphereLight(0xeeeeff, 0x333333, 0.75);
    light.position.set(0.5, 1, 0.75);
    this.scene.add(light);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);
    // this.scene.add(this.cube);

    this.initLoader();
    this.animate();
  }

  private initLoader(): void {
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
    });

    this.OBJLoader.load('/assets/3D-poly/box-test-an.obj', (obj) => {
      obj.traverse((child) => {
        (child as THREE.Mesh).material = material;
      });
      const obj1 = this.innerBox.clone();
      const obj2 = this.innerBox.clone();

      obj1.position.x = 15;
      obj1.position.y = 2;

      obj2.position.z = 15;
      obj2.position.y = 2;

      this.objList.push(obj1, obj2);
      this.scene.add(obj1, obj2);
    });
    this.GLTFLoader.load('/assets/3D-poly/box-an-test-02.glb', (gltf) => {
      const model = gltf.scene;
      const mixer = new THREE.AnimationMixer(model);
      this.mixerList.push(mixer);

      gltf.scene.children.forEach((child) => {
        (child as THREE.Mesh).material = material;
      });

      // const clip1 = gltf.animations[0];
      // const action1 = mixer.clipAction(clip1);
      // action1.play();

      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        this.actionList.push(action);
        // 停在最後一格
        action.clampWhenFinished = true;
        // 只播放一次
        // action.setLoop(THREE.LoopOnce, 1);
      });
      this.box = gltf.scene;
      this.innerBox.position.y = 1;
      this.scene.add(this.innerBox);
      this.scene.add(this.box);
    });
  }

  private controlAction() {
    if (!this.box) {
      return;
    }
    //获取刷新时间
    //velocity每次的速度，为了保证有过渡
    this.velocity.y -= this.G; // 默认下降的速度
    //复制相机的位置

    //获取相机靠下的位置

    let originPoint = this.innerBox.position.clone();

    const minY = 0.2;
    let isOnObject = false;

    // this.downRaycaster.ray.origin.copy(this.innerBox.position);
    // this.downRaycaster.ray.origin.y -= minY;
    // //判断是否停留在了立方体上面
    // const intersections = this.downRaycaster.intersectObjects(
    //   this.objList,
    //   true
    // );
    // isOnObject = isOnObject || intersections.length > 0;

    this.footerVector3List.forEach((vector3) => {
      const o = this.innerBox.position.clone();
      o.x += vector3.x;
      o.z += vector3.z;

      this.downRaycaster.ray.origin.copy(o);
      this.downRaycaster.ray.origin.y -= minY;

      const intersections = this.downRaycaster.intersectObjects(
        this.objList,
        true
      );
      isOnObject = isOnObject || intersections.length > 0;
    });

    //判断是否停在了立方体上面
    if (isOnObject) {
      this.velocity.y = Math.max(0, this.velocity.y);
      this.canJump = true;
    }
    //根据速度值移动控制器
    this.innerBox.translateY(this.velocity.y);
    if (this.innerBox.position.y <= 2 + minY) {
      this.velocity.y = 0;
      this.innerBox.position.y = 2 + minY;
      this.canJump = true;
    }

    this.velocity.x = this.innerBox.position.x;
    this.velocity.z = this.innerBox.position.z;

    let deg = this.innerBox.rotation.y;
    let direction = new THREE.Vector3(Math.sin(deg), 0, Math.cos(deg));
    direction.normalize();

    //给向量使用变换矩阵
    direction.multiply(new THREE.Vector3(0.3, 0, 0.3));
    if (this.moveForward) {
      this.innerBox.position.add(direction);
    }
    if (this.moveBackward) {
      direction = new THREE.Vector3(
        Math.sin(deg + Math.PI),
        0,
        Math.cos(deg + Math.PI)
      );
      direction.multiply(new THREE.Vector3(0.3, 0, 0.3));
      this.innerBox.position.add(direction);
    }
    // if (this.moveLeft) {
    //   this.innerBox.rotation.y += 0.05;
    // }
    // if (this.moveRight) {
    //   this.innerBox.rotation.y -= 0.05;
    // }

    originPoint = this.innerBox.position.clone();
    const boxVertices = this.innerBox.geometry.vertices;

    let isCollision = false;
    let collisionResults;

    this.horizontalRaycaster.set(originPoint, direction);
    collisionResults = this.horizontalRaycaster.intersectObjects(this.objList);
    isCollision =
      isCollision ||
      (() => {
        const r = collisionResults.length !== 0;
        if (r) {
          // console.log([...collisionResults]);
        }
        return r;
      })();

    if (isCollision) {
      // console.log(collisionResults);
      this.innerBox.position.setX(this.velocity.x);
      this.innerBox.position.setZ(this.velocity.z);
    }
  }

  private updateAn(): void {
    if (this.mixerList) {
      const delta = this.clock.getDelta();
      for (var i = 0; i < this.mixerList.length; i++) {
        // 重複播放動畫
        this.mixerList[i].update(delta);
      }
    }
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.updateAn();
    this.controlAction();
    this.renderer.render(this.scene, this.camera);
  }
}
