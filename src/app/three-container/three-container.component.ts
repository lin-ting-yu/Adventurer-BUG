import { async } from '@angular/core/testing';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-three-container',
  templateUrl: './three-container.component.html',
  styleUrls: ['./three-container.component.scss'],
})
export class ThreeContainerComponent implements OnInit {

  constructor() {}

  @ViewChild('canvasContainer') canvasContainer: ElementRef;

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  private renderer = new THREE.WebGLRenderer();
  private geometry = new THREE.BoxGeometry();
  private material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  private cube = new THREE.Mesh(this.geometry, this.material);

  ngOnInit(): void {
    this.init();

  }

  private async init() {
    await this.canvasContainer;
    console.log(this.canvasContainer);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);
    this.scene.add(this.cube);

    this.camera.position.z = 5;
    this.animate();
  }

  private animate() {
    requestAnimationFrame(() => this.animate());

    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;

    this.renderer.render(this.scene, this.camera);
  }
}
