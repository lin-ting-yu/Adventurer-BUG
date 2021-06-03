import { AnimationService } from './robot-animation.service';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, sampleTime } from 'rxjs/operators';

@Component({
  selector: 'app-world-container',
  templateUrl: './world-container.component.html',
  styleUrls: ['./world-container.component.scss'],
})
export class WorldContainerComponent implements OnInit, OnDestroy {
  constructor() { }

  @ViewChild('canvasContainer') canvasContainer: ElementRef;
  private readonly OBJLoader = new OBJLoader();
  private readonly clock = new THREE.Clock();

  private readonly scene = new THREE.Scene();

  // 相機相關
  private aspect = window.innerHeight / window.innerWidth;
  private frustumSize = 90 - (this.aspect < 1 ? 0 : this.aspect * 15);
  private readonly camera = new THREE.OrthographicCamera(
    this.frustumSize / -2,
    this.frustumSize / 2,
    (this.frustumSize * this.aspect) / 2,
    (this.frustumSize * this.aspect) / -2,
    1,
    1000
  );

  // 渲染器
  private readonly renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });

  // 控制相關參數
  private readonly jumpSpeed = 0.6; // 跳起速度
  private readonly moveSpeed = 0.1; // 跳起速度
  private readonly G = 0.02;

  isMoveLeft: boolean = false;
  isMoveRight: boolean = false;
  private isMoving: boolean = false;
  private isStoping: boolean = false;
  private isCanJump: boolean = false;
  isSpaceUp: boolean = true;
  private isJumping: boolean = false;
  private jumpSubject: Subject<void> = new Subject();
  private jumpSubscription$: Subscription;
  // 玩家碰撞箱
  private collisionBox: THREE.Mesh<THREE.Geometry, THREE.MeshPhongMaterial> =
    null;
  // 需要檢查碰撞的物體
  private needCheckList = [];
  // 移動位置儲存
  private controlPosition = new THREE.Vector3();
  // 方向判斷
  private direction = new THREE.Vector3();

  // 左右碰撞用的 Raycaster
  private readonly horizontalRaycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(),
    0,
    1
  );

  // 跳躍判斷採地用的 Raycaster
  private readonly downRaycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    1
  );
  // 跳躍判斷採地用的 Raycaster
  private readonly headRaycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, 1, 0),
    0,
    1
  );

  // 主體底面座標，判定碰撞用
  private checkVector3List: THREE.Vector3[] = [];

  private materialData = {
    robot: new THREE.MeshPhongMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
    }),
    floor: new THREE.MeshPhongMaterial({
      color: 0xaaaaaa,
      side: THREE.FrontSide,
    }),
    collision: new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
    }),
  };

  private robotPoly: THREE.Group = null;

  private animationService: AnimationService = null;

  // 事件綁定
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.aspect = window.innerHeight / window.innerWidth;
    this.frustumSize = 90 - (this.aspect < 1 ? 0 : this.aspect * 30);
    this.camera.left = this.frustumSize / -2;
    this.camera.right = this.frustumSize / 2;
    this.camera.top = (this.frustumSize * this.aspect) / 2;
    this.camera.bottom = (-this.frustumSize * this.aspect) / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft': // left
      case 'a': // a
        this.leftDown();
        break;
      case 'ArrowRight': // right
      case 'd': // d
        this.rightDown();
        break;
      case ' ': // space
        this.jumpDown();
        // this.jumpSubject.next();
        break;
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft': // left
      case 'a': // a
        this.leftUp();
        break;
      case 'ArrowRight': // right
      case 'd': // d
        this.rightUp();
        break;
      case ' ': // space
        this.jumpUp();
        break;
    }
  }

  ngOnInit(): void {
    this.jumpSubscription$ = this.jumpSubject.asObservable()
      .pipe(
        sampleTime(500)
      )
      .subscribe(() => {
        this.jumpDown()
      })
    this.threeInit();
  }

  ngOnDestroy(): void {
    this.jumpSubscription$.unsubscribe()
  }

  private async threeInit() {
    await this.canvasContainer;

    // 參數為座標軸長度
    // const axes = new THREE.AxesHelper(30);
    // axes.position.y = 0;
    // this.scene.add(axes);

    // 增加遠景消失
    this.scene.background = new THREE.Color(0x252d33);
    this.scene.fog = new THREE.Fog(0x252d33, 10, 28);

    // 相機
    this.camera.position.x = -10;
    this.camera.position.y = 10;
    this.camera.position.z = 10;
    this.camera.lookAt(0, 0, 0);
    this.camera.position.y = 15;
    this.camera.updateProjectionMatrix();

    // 光源
    const light = new THREE.HemisphereLight(0xbcc1e3, 0x252d33, 0.75);
    light.position.set(0.5, 1, 0.75);

    const light2 = new THREE.PointLight(0xbcc1e3, 0.8, 30);
    light2.position.set(-20, 10, 0);
    light2.castShadow = true;
    light2.shadow.camera.near = 0.1;
    light2.shadow.camera.far = 25;

    this.scene.add(light, light2);

    // 渲染器
    // 開啟隱影
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);

    this.createObstacle();
    this.load3DPoly();
    this.animate();
  }

  private load3DPoly(): void {
    // 載入主角模型
    this.OBJLoader.load('./assets/3D-poly/bug6.obj', (obj) => {
      this.robotPoly = obj as THREE.Group;

      this.animationService = new AnimationService(this.robotPoly);
      const mesh = this.robotPoly.children[0] as THREE.Mesh;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // 創建碰撞箱
      const geometry = mesh.geometry;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      const max = geometry.boundingBox.max;
      const min = geometry.boundingBox.min;

      // 只需要判斷接觸地面的點
      this.checkVector3List = [
        new THREE.Vector3(max.x, 0, max.z),
        new THREE.Vector3(max.x, 0, min.z),
        new THREE.Vector3(min.x, 0, max.z),
        new THREE.Vector3(min.x, 0, min.z),
      ];

      this.collisionBox = new THREE.Mesh(
        new THREE.BoxGeometry(
          Math.abs(max.x - min.x),
          2,
          Math.abs(max.z - min.z)
        ),
        this.materialData.collision
      );
      this.collisionBox.visible = false;
      this.collisionBox.position.y = 20;

      // geometry.center();

      this.robotPoly.traverse(async (child: THREE.Mesh) => {
        child.material = this.materialData.robot;
      });

      this.scene.add(this.collisionBox, obj);
    });
  }

  private controlAction() {
    if (!this.collisionBox) {
      return;
    }

    this.handleJump();
    this.handleMove();
    this.upddateRobot();
  }

  private handleJump(): void {
    this.controlPosition.y -= this.G;

    // 這邊寫死 有待一日寫成彈性 呵呵
    const minY = 0.2;

    let isOnObject = false;
    let onObjectIntersections: THREE.Intersection[] = [];
    // 檢查所有底部的點
    this.checkVector3List.forEach((vector3) => {
      const o = this.collisionBox.position.clone();
      // 讓向量始終垂直向下
      o.x += vector3.x;
      o.z += vector3.z;

      this.downRaycaster.ray.origin.copy(o);
      this.downRaycaster.ray.origin.y -= minY;

      onObjectIntersections.push(...this.downRaycaster.intersectObjects(
        this.needCheckList,
        true
      ));
      isOnObject = isOnObject || onObjectIntersections.length > 0;
    });

    let isUnderObject = false;
    // 檢查所有頭的點
    this.checkVector3List.forEach((vector3) => {
      const o = this.collisionBox.position.clone();
      // 讓向量始終垂直向下
      o.x += vector3.x;
      o.z += vector3.z;

      this.headRaycaster.ray.origin.copy(o);
      this.headRaycaster.ray.origin.y += minY;

      const intersections = this.headRaycaster.intersectObjects(
        this.needCheckList,
        true
      );
      isUnderObject = isUnderObject || intersections.length > 0;
    });

    if (isUnderObject) {
      this.controlPosition.y = Math.min(this.controlPosition.y, 0);
    }

    //判断是否停在了立方体上面
    if (isOnObject) {


      this.controlPosition.y = Math.max(0, this.controlPosition.y);


      if (this.isJumping) {
        this.isJumping = false;
        // 這邊用偷吃步的方式計算最頂部
        // 因為這裡的碰撞物都是平面
        // 所以直接取碰撞物的 y 座標當作最後值
        // 降低陷入地板的可能
        const maxPosY: number = (() => {
          let maxY = -100;
          onObjectIntersections.forEach(intersections => {
            const o = intersections.object as THREE.Mesh;
            maxY = Math.max(maxY, o.position.y)

          });
          return maxY;
        })();
        this.controlPosition.y = Math.min(maxPosY, this.controlPosition.y);
        this.animationService.gotoAndPlay('jumpEnd').then(() => {
          this.isCanJump = true;
          this.isMoving = false;
          this.isStoping = false;
        });
      } else {
        this.isCanJump = true;
      }
    }
    //根据速度值移动控制器
    this.collisionBox.translateY(this.controlPosition.y);
    // 這邊 1 寫死 有待一日寫成彈性
    // 這段拿掉就可以往下摔死
    // if (this.collisionBox.position.y <= 1 + minY) {
    //   this.controlPosition.y = 0;
    //   this.collisionBox.position.y = 1 + minY;
    //   if (this.isJumping) {
    //     this.isJumping = false;
    //     this.animationService.gotoAndPlay('jumpEnd').then(() => {
    //       this.isCanJump = true;
    //       this.isMoving = false;
    //       this.isStoping = false;
    //     });
    //   } else {
    //     this.isCanJump = true;
    //   }
    // }
    if (this.collisionBox.position.y <= -50) {
      this.collisionBox.position.x = 0;
      this.collisionBox.position.y = 20;
      this.collisionBox.position.z = 0;
      this.controlPosition.y = -this.G
    }
  }

  private handleMove(): void {
    let originPoint = this.collisionBox.position.clone();

    this.controlPosition.x = this.collisionBox.position.x;
    this.controlPosition.z = this.collisionBox.position.z;

    //给向量使用变换矩阵
    if (this.isMoveLeft) {
      this.direction.setX(-this.moveSpeed);
      this.collisionBox.position.add(this.direction);
    }
    if (this.isMoveRight) {
      this.direction.setX(this.moveSpeed);
      this.collisionBox.position.add(this.direction);
    }
    if (!this.isJumping) {
      if (this.isMoveLeft || this.isMoveRight) {
        if (!this.isMoving) {
          this.isMoving = true;
          this.isStoping = false;
          this.animationService.gotoAndPlay('move', false).then(() => {
            this.isMoving = false;
          });
        }
      } else {
        if (!this.isStoping) {
          this.isStoping = true;
          this.isMoving = false;
          this.animationService.gotoAndPlay('stop', false).then(() => {
            this.isStoping = false;
          });
        }
      }
    }

    originPoint = this.collisionBox.position.clone();

    let isCollision = false;
    let collisionResults;

    this.horizontalRaycaster.set(originPoint, this.direction);
    collisionResults = this.horizontalRaycaster.intersectObjects(
      this.needCheckList
    );
    isCollision = isCollision || collisionResults.length !== 0;

    if (isCollision) {
      // console.log(collisionResults);
      this.collisionBox.position.setX(this.controlPosition.x);
      this.collisionBox.position.setZ(this.controlPosition.z);
    }
  }

  private upddateRobot(): void {
    if (!this.robotPoly) {
      return;
    }
    if (this.direction.x > 0) {
      this.robotPoly.rotation.y = 0;
    } else {
      this.robotPoly.rotation.y = Math.PI;
    }

    const prev = this.robotPoly.position.y;

    this.robotPoly.position.set(
      this.collisionBox.position.x,
      this.collisionBox.position.y - 1, // 1 是中心點不一樣的偏移
      this.collisionBox.position.z
    );

    if (prev > this.robotPoly.position.y) {
      this.isJumping = true;
    }
  }

  private createObstacle(): void {
    const floor = this.getBox(30, 20, 5);
    // const wall1 = this.getBox(2, 100, 5);
    // const wall2 = this.getBox(2, 100, 5);
    floor.position.y = 0;
    // wall1.position.x = -17;
    // wall2.position.x = 17;
    // wall1.visible = false;
    // wall2.visible = false;

    [
      // width, height, depth, x, y
      [2, 2, 3, -12, 1.5],
      [5, 1, 4, 5, 5],
      [5, 1, 5, -6, 10],
    ].forEach((boxData) => {
      const box = this.getBox(boxData[0], boxData[1], boxData[2]);
      box.position.x = boxData[3];
      box.position.y = boxData[4];
    });
  }

  private getBox(
    width: number,
    height: number,
    depth: number,
    isCheck = true
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      this.materialData.floor
    );
    // 把重心偏移到頂部
    mesh.geometry.translate(0, height / -2, 0);
    mesh.receiveShadow = true;
    if (isCheck) {
      this.needCheckList.push(mesh);
    }
    this.scene.add(mesh);
    return mesh;
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.controlAction();
    this.renderer.render(this.scene, this.camera);
  }

  leftUp(): void {
    this.isMoveLeft = false;
  }
  rightUp(): void {
    this.isMoveRight = false;
  }
  jumpUp(): void {
    this.isSpaceUp = true;
  }

  leftDown(): void {
    this.isMoveLeft = true;
  }
  rightDown(): void {
    this.isMoveRight = true;
  }
  jumpDown(): void {
    if (this.isCanJump && this.isSpaceUp && !this.isJumping) {
      console.log('jump', this.isCanJump, this.isSpaceUp)
      this.isCanJump = false;
      this.animationService
        .gotoAndPlay('jumpStart')
        .then(() => {
          this.controlPosition.y += this.jumpSpeed;
          setTimeout(() => {
            this.isJumping = true;
          }, 100);

          this.isMoving = false;
          this.isStoping = false;
          return this.animationService.gotoAndPlay('jumpProcess');
        })
        .then(() => {
          this.animationService.gotoAndPlay('jumpTop');
        });
    }
    this.isCanJump = false;
    this.isSpaceUp = false;
  }
}
