import { Injectable } from '@angular/core';
import { Tween } from 'createjs-module';
import * as THREE from 'three';

export class AnimationService {
  constructor(obj: THREE.Group) {
    this.obj = obj;
    this.mesh = obj.children[0] as THREE.Mesh;
  }

  private readonly obj: THREE.Group;
  private readonly mesh: THREE.Mesh;
  private readonly tweensTargetList = [];
  private readonly timeline: {
    [key: string]: () => Promise<void>;
  } = {
    jumpStart: (): Promise<void> => {
      return this.playAnmation([
        () =>
          new Promise<void>((next) => {
            this.tweenGet(this.obj.scale)
              .to(
                {
                  x: 1.2,
                  y: 0.5,
                  z: 1.2,
                },
                200
              )
              .call(() => {
                next();
              });
          }),
      ]);
    },
    jumpProcess: (): Promise<void> => {
      return this.playAnmation([
        () =>
          new Promise<void>((next) => {
            this.tweenGet(this.obj.scale)
              .to(
                {
                  x: 0.7,
                  y: 1.5,
                  z: 0.7,
                },
                200
              )
              .call(() => {
                next();
              });
          }),
      ]);
    },
    jumpTop: (): Promise<void> => {
      return this.playAnmation([
        () =>
          new Promise<void>((next) => {
            this.tweenGet(this.obj.scale)
              .to(
                {
                  x: 1,
                  y: 1,
                  z: 1,
                },
                200
              )
              .call(() => {
                next();
              });
          }),
      ]);
    },
    jumpEnd: (): Promise<void> => {
      return this.playAnmation([
        () =>
          new Promise<void>((next) => {
            this.tweenGet(this.obj.scale)
              .to(
                {
                  x: 1.2,
                  y: 0.5,
                  z: 1.2,
                },
                70
              )
              .call(() => {
                next();
              });
          }),
        () =>
          new Promise<void>((next) => {
            this.tweenGet(this.obj.scale)
              .to(
                {
                  x: 1,
                  y: 1,
                  z: 1,
                },
                150
              )
              .call(() => {
                next();
              });
          }),
      ]);
    },
    move: (): Promise<void> => {
      this.resetMesh();
      return this.playAnmation([
        () =>
          new Promise<void>((next) => {
            this.tweenGet(this.mesh.rotation)
              .to(
                {
                  z: 0.2,
                },
                200
              )
              .call(() => {
                next();
              });
            this.tweenGet(this.mesh.position)
              .to(
                {
                  y: 0.3,
                },
                150
              )
              .call(() => {
                next();
              });
          }),
        () =>
          new Promise<void>((next) => {
            this.tweenGet(this.mesh.rotation)
              .to(
                {
                  z: 0,
                },
                150
              )
              .call(() => {
                next();
              });
            this.tweenGet(this.mesh.position)
              .to(
                {
                  y: 0,
                },
                200
              )
              .call(() => {
                next();
              });
          }),
      ]);
    },
    stop: (): Promise<void> => {
      this.resetMesh();
      return this.playAnmation([
        () =>
          new Promise<void>((next) => {
            this.tweenGet(this.mesh.scale)
              .to(
                {
                  x: 1.01,
                  y: 0.9,
                  z: 1.01,
                },
                300
              )
              .call(() => {
                next();
              });
          }),
        () =>
          new Promise<void>((next) => {
            this.tweenGet(this.mesh.scale)
              .to(
                {
                  x: 1,
                  y: 1,
                  z: 1,
                },
                300
              )
              .call(() => {
                next();
              });
          }),
      ]);
    },
  };

  private tweenGet(target): Tween {
    this.addTweensTarget(target);
    return Tween.get(target);
  }
  private playAnmation(list: (() => Promise<any>)[]): Promise<void> {
    return new Promise((finsh) => {
      const next = list[0];
      if (next) {
        next().then(() => {
          const nextList = list.slice(1);
          this.playAnmation(nextList).then(() => {
            finsh();
          });
        });
      } else {
        finsh();
      }
    });
  }

  private addTweensTarget(...targetList): void {
    targetList.forEach((target) => {
      if (this.tweensTargetList.indexOf(target) < 0) {
        this.tweensTargetList.push(target);
      }
    });
  }

  stopAllAnimation(): void {
    this.resetMesh();
    this.tweensTargetList.forEach((target) => {
      Tween.removeTweens(target);
    });
    this.tweensTargetList.length = 0;
  }

  private resetMesh(): void {
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.scale.set(1, 1, 1);
    Tween.removeTweens(this.mesh.scale);
    Tween.removeTweens(this.mesh.rotation);
    Tween.removeTweens(this.mesh.position);
  }

  gotoAndPlay(keyName: string, stopAll = true): Promise<void> {
    const an = this.timeline[keyName];
    return new Promise((finsh) => {
      if (an) {
        stopAll && this.stopAllAnimation();
        an().then(() => {
          finsh();
        });
      } else {
        finsh();
      }
    });
  }
}
