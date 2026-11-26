'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ColorScheme,
  MoleculeData,
  RepresentationMode,
} from '@/lib/chemistry/types';
import {
  getChainColor,
  getElementInfo,
  getHydrophobicityColor,
} from '@/lib/chemistry/elements';
import { buildMolecularSurfaceGeometry } from '@/lib/three/surfaceMesh';

export interface MoleculeCanvasHandle {
  resetCamera: () => void;
  exportPng: () => void;
}

interface MoleculeCanvasProps {
  molecule: MoleculeData;
  representation: RepresentationMode;
  colorScheme: ColorScheme;
  autoRotate: boolean;
  selectedAtomIndex: number | null;
  selectedBondIndex: number | null;
  onSelectAtom: (index: number | null) => void;
  onSelectBond: (index: number | null) => void;
  webglLostLabel: string;
}

// Reusable math scratch objects (Zero GC inside render loop)
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _perp = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _color = new THREE.Color();
const _mouse = new THREE.Vector2();

function resolveAtomColor(
  molecule: MoleculeData,
  atomIndex: number,
  colorScheme: ColorScheme,
): string {
  const atom = molecule.atoms[atomIndex];
  if (!atom) return '#10B981';
  if (colorScheme === 'hydrophobicity') {
    return getHydrophobicityColor(atom.hydrophobicity);
  }
  if (colorScheme === 'chain') {
    return getChainColor(atom.chainId);
  }
  return getElementInfo(atom.element).cpkHex;
}

export const MoleculeCanvas = forwardRef<MoleculeCanvasHandle, MoleculeCanvasProps>(
  function MoleculeCanvas(
    {
      molecule,
      representation,
      colorScheme,
      autoRotate,
      selectedAtomIndex,
      selectedBondIndex,
      onSelectAtom,
      onSelectBond,
      webglLostLabel,
    },
    ref,
  ) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [contextLost, setContextLost] = useState(false);

    // Keep latest callbacks & props in refs so WebGL scene never tears down on UI updates
    const onSelectAtomRef = useRef(onSelectAtom);
    onSelectAtomRef.current = onSelectAtom;
    const onSelectBondRef = useRef(onSelectBond);
    onSelectBondRef.current = onSelectBond;
    const autoRotateRef = useRef(autoRotate);
    autoRotateRef.current = autoRotate;

    const sceneApiRef = useRef<{
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
      controls: OrbitControls;
      moleculeGroup: THREE.Group;
      highlightMesh: THREE.Mesh;
      highlightBondMesh: THREE.Mesh;
      atomInstanced: THREE.InstancedMesh | null;
      bondInstanced: THREE.InstancedMesh | null;
      bondLookup: number[]; // maps bond mesh instanceId -> molecule.bonds index
      isSoftwareGl: boolean;
      requestRender: () => void;
      resetCameraToRadius: (radius: number) => void;
      setCameraTargetLerp: (pos: THREE.Vector3, target: THREE.Vector3) => void;
      currentRadius: number;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        const api = sceneApiRef.current;
        if (!api) return;
        api.resetCameraToRadius(api.currentRadius);
      },
      exportPng: () => {
        const api = sceneApiRef.current;
        if (!api) return;
        api.renderer.render(api.scene, api.camera);
        const url = api.renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${molecule.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'molecule'}.png`;
        link.href = url;
        link.click();
      },
    }));

    // Initialize Three.js WebGL stage once
    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const isSoftwareGl = (() => {
        try {
          const probe = document.createElement('canvas').getContext('webgl2');
          if (!probe) return true;
          const ext = probe.getExtension('WEBGL_debug_renderer_info');
          const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
          const gpu = String(probe.getParameter(param));
          probe.getExtension('WEBGL_lose_context')?.loseContext();
          return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        } catch {
          return false;
        }
      })();

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#020705');
      scene.fog = new THREE.FogExp2('#020705', 0.011);

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 400);
      camera.position.set(0, 3, 18);

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.setPixelRatio(
        isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
      );
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      container.appendChild(renderer.domElement);

      // Procedural studio environment map
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envTexture = pmremGenerator.fromScene(
        new RoomEnvironment(),
        0.04,
      ).texture;
      scene.environment = envTexture;
      pmremGenerator.dispose();

      // Three-point studio lighting rig with warm key + deep emerald fill + rim
      const hemiLight = new THREE.HemisphereLight('#6ee7b7', '#010604', 0.82);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight('#fff4e0', 1.65);
      keyLight.position.set(12, 16, 14);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight('#059669', 0.85);
      rimLight.position.set(-14, -6, -12);
      scene.add(rimLight);

      const moleculeGroup = new THREE.Group();
      scene.add(moleculeGroup);

      // Selection highlight meshes
      const highlightGeo = new THREE.SphereGeometry(1, 24, 24);
      const highlightMat = new THREE.MeshBasicMaterial({
        color: '#10B981',
        wireframe: true,
        transparent: true,
        opacity: 0.78,
      });
      const highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
      highlightMesh.visible = false;
      scene.add(highlightMesh);

      const highlightBondGeo = new THREE.CylinderGeometry(1, 1, 1, 16);
      const highlightBondMat = new THREE.MeshBasicMaterial({
        color: '#10B981',
        wireframe: true,
        transparent: true,
        opacity: 0.8,
      });
      const highlightBondMesh = new THREE.Mesh(highlightBondGeo, highlightBondMat);
      highlightBondMesh.visible = false;
      scene.add(highlightBondMesh);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.07;
      controls.enablePan = true;
      controls.minDistance = 2.2;
      controls.maxDistance = 160;
      controls.autoRotate = false;
      controls.autoRotateSpeed = 1.4;

      // Pre-warm shaders on GPU devices
      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      let frameId = 0;
      let renderBusy = false;
      let renderDirty = false;
      let disposed = false;

      // Smooth camera transition state
      let camAnimActive = false;
      const desiredCamPos = new THREE.Vector3();
      const desiredTarget = new THREE.Vector3();
      let lastTime = performance.now();

      function afterDraw(cb: () => void) {
        if (disposed) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || typeof gl.fenceSync !== 'function') {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      function requestRender() {
        if (disposed) return;
        if (renderBusy) {
          renderDirty = true;
          return;
        }
        renderBusy = true;
        frameId = requestAnimationFrame(() => {
          if (disposed) return;
          renderDirty = false;
          const now = performance.now();
          const dt = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
          lastTime = now;

          let needsMore = false;

          if (camAnimActive) {
            const dampAlpha = 1 - Math.exp(-8 * dt);
            camera.position.lerp(desiredCamPos, dampAlpha);
            controls.target.lerp(desiredTarget, dampAlpha);
            if (
              camera.position.distanceToSquared(desiredCamPos) < 0.002 &&
              controls.target.distanceToSquared(desiredTarget) < 0.002
            ) {
              camera.position.copy(desiredCamPos);
              controls.target.copy(desiredTarget);
              camAnimActive = false;
            } else {
              needsMore = true;
            }
          }

          if (!isSoftwareGl && autoRotateRef.current) {
            controls.autoRotate = true;
            needsMore = true;
          } else {
            controls.autoRotate = false;
          }

          const damped = controls.update();
          if (damped && !isSoftwareGl) needsMore = true;

          renderer.render(scene, camera);

          const done = () => {
            renderBusy = false;
            if (renderDirty || needsMore) {
              requestRender();
            }
          };

          if (isSoftwareGl) afterDraw(done);
          else done();
        });
      }

      const handleControlsChange = () => requestRender();
      const handleControlsStart = () => {
        camAnimActive = false;
        requestRender();
      };
      controls.addEventListener('change', handleControlsChange);
      controls.addEventListener('start', handleControlsStart);

      // Raycasting on pointer click vs drag
      const raycaster = new THREE.Raycaster();
      let pointerDownX = 0;
      let pointerDownY = 0;
      let lastHoverCheck = 0;

      const onPointerDown = (e: PointerEvent) => {
        pointerDownX = e.clientX;
        pointerDownY = e.clientY;
      };

      const onPointerMove = (e: PointerEvent) => {
        const now = performance.now();
        if (now - lastHoverCheck < 50) return;
        lastHoverCheck = now;
        const api = sceneApiRef.current;
        if (!api) return;
        const rect = renderer.domElement.getBoundingClientRect();
        _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(_mouse, camera);

        const targets: THREE.Object3D[] = [];
        if (api.atomInstanced) targets.push(api.atomInstanced);
        if (api.bondInstanced) targets.push(api.bondInstanced);
        const hits = raycaster.intersectObjects(targets, false);
        renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
      };

      const onPointerUp = (e: PointerEvent) => {
        const dx = e.clientX - pointerDownX;
        const dy = e.clientY - pointerDownY;
        if (dx * dx + dy * dy > 25) return; // Ignore drag-orbit gestures

        const api = sceneApiRef.current;
        if (!api) return;
        const rect = renderer.domElement.getBoundingClientRect();
        _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(_mouse, camera);

        const atomHits = api.atomInstanced
          ? raycaster.intersectObject(api.atomInstanced, false)
          : [];
        const bondHits = api.bondInstanced
          ? raycaster.intersectObject(api.bondInstanced, false)
          : [];

        const firstAtom = atomHits[0];
        const firstBond = bondHits[0];

        if (
          firstAtom &&
          firstAtom.instanceId !== undefined &&
          (!firstBond || firstAtom.distance <= firstBond.distance + 0.05)
        ) {
          onSelectBondRef.current(null);
          onSelectAtomRef.current(firstAtom.instanceId);
        } else if (firstBond && firstBond.instanceId !== undefined) {
          const bondIdx = api.bondLookup[firstBond.instanceId];
          if (bondIdx !== undefined) {
            onSelectAtomRef.current(null);
            onSelectBondRef.current(bondIdx);
          }
        } else {
          onSelectAtomRef.current(null);
          onSelectBondRef.current(null);
        }
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerup', onPointerUp);

      const onContextLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const onContextRestored = () => {
        setContextLost(false);
        requestRender();
      };
      renderer.domElement.addEventListener('webglcontextlost', onContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          if (w > 0 && h > 0) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            requestRender();
          }
        }
      });
      resizeObserver.observe(container);

      const resetCameraToRadius = (radius: number) => {
        const dist = Math.max(6, radius * 2.55);
        desiredTarget.set(0, 0, 0);
        desiredCamPos.set(dist * 0.35, dist * 0.25, dist);
        if (isSoftwareGl) {
          camera.position.copy(desiredCamPos);
          controls.target.copy(desiredTarget);
          controls.update();
          requestRender();
        } else {
          camAnimActive = true;
          requestRender();
        }
      };

      const setCameraTargetLerp = (pos: THREE.Vector3, target: THREE.Vector3) => {
        desiredCamPos.copy(pos);
        desiredTarget.copy(target);
        if (isSoftwareGl) {
          camera.position.copy(desiredCamPos);
          controls.target.copy(desiredTarget);
          controls.update();
          requestRender();
        } else {
          camAnimActive = true;
          requestRender();
        }
      };

      sceneApiRef.current = {
        scene,
        camera,
        renderer,
        controls,
        moleculeGroup,
        highlightMesh,
        highlightBondMesh,
        atomInstanced: null,
        bondInstanced: null,
        bondLookup: [],
        isSoftwareGl,
        requestRender,
        resetCameraToRadius,
        setCameraTargetLerp,
        currentRadius: 6,
      };

      requestRender();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        resizeObserver.disconnect();
        controls.removeEventListener('change', handleControlsChange);
        controls.removeEventListener('start', handleControlsStart);
        controls.dispose();
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
        renderer.domElement.removeEventListener(
          'webglcontextrestored',
          onContextRestored,
        );
        highlightGeo.dispose();
        highlightMat.dispose();
        highlightBondGeo.dispose();
        highlightBondMat.dispose();
        envTexture.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        sceneApiRef.current = null;
      };
    }, []);

    // Trigger continuous render loop when autoRotate changes on GPU devices
    useEffect(() => {
      const api = sceneApiRef.current;
      if (!api) return;
      api.requestRender();
    }, [autoRotate]);

    // Rebuild instanced geometry when molecule, representation, or colorScheme changes
    useEffect(() => {
      const api = sceneApiRef.current;
      if (!api) return;

      const { moleculeGroup, isSoftwareGl } = api;

      // Dispose previous geometries & materials inside moleculeGroup
      while (moleculeGroup.children.length > 0) {
        const child = moleculeGroup.children[0] as THREE.Mesh;
        moleculeGroup.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
      api.atomInstanced = null;
      api.bondInstanced = null;
      api.bondLookup = [];

      const atomCount = molecule.atoms.length;
      const segs = atomCount > 250 ? 16 : 26;

      // 1. Atoms InstancedMesh (shown in Ball & Stick, Space-Filling, Licorice, and faintly inside Surface)
      const showAtoms = representation !== 'surface';
      const sphereGeo = new THREE.SphereGeometry(1, segs, segs);
      const atomMat = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        roughness: representation === 'space-filling' ? 0.34 : 0.24,
        metalness: 0.08,
        clearcoat: 0.45,
        clearcoatRoughness: 0.2,
      });

      if (showAtoms && atomCount > 0) {
        const atomMesh = new THREE.InstancedMesh(sphereGeo, atomMat, atomCount);
        atomMesh.castShadow = !isSoftwareGl;
        atomMesh.receiveShadow = !isSoftwareGl;
        atomMesh.frustumCulled = false;

        for (let i = 0; i < atomCount; i++) {
          const a = molecule.atoms[i];
          const elInfo = getElementInfo(a.element);
          let radius: number;
          if (representation === 'space-filling') {
            radius = elInfo.vdwRadius * 0.92;
          } else if (representation === 'licorice') {
            radius = 0.145;
          } else {
            // Ball & Stick
            radius = Math.max(0.24, Math.min(0.62, elInfo.covalentRadius * 0.56));
          }

          _vecA.set(a.x, a.y, a.z);
          _quat.identity();
          _scale.set(radius, radius, radius);
          _mat4.compose(_vecA, _quat, _scale);
          atomMesh.setMatrixAt(i, _mat4);

          _color.set(resolveAtomColor(molecule, i, colorScheme));
          atomMesh.setColorAt(i, _color);
        }

        atomMesh.instanceMatrix.needsUpdate = true;
        if (atomMesh.instanceColor) atomMesh.instanceColor.needsUpdate = true;
        atomMesh.computeBoundingSphere();
        moleculeGroup.add(atomMesh);
        api.atomInstanced = atomMesh;
      } else {
        sphereGeo.dispose();
        atomMat.dispose();
      }

      // 2. Bonds InstancedMesh (two half-cylinders per bond strand so each half inherits its atom's color!)
      const showBonds =
        representation === 'ball-and-stick' || representation === 'licorice';
      if (showBonds && molecule.bonds.length > 0) {
        // Count cylinder segments needed (2 halves per strand; 2 strands for double/aromatic, 3 for triple)
        let totalCylinders = 0;
        for (const b of molecule.bonds) {
          const strands = b.order === 2 || b.order === 1.5 ? 2 : b.order === 3 ? 3 : 1;
          totalCylinders += strands * 2;
        }

        const cylGeo = new THREE.CylinderGeometry(1, 1, 1, atomCount > 250 ? 10 : 14);
        const bondMat = new THREE.MeshStandardMaterial({
          color: '#ffffff',
          roughness: 0.35,
          metalness: 0.14,
        });

        const bondMesh = new THREE.InstancedMesh(cylGeo, bondMat, totalCylinders);
        bondMesh.castShadow = !isSoftwareGl;
        bondMesh.receiveShadow = !isSoftwareGl;
        bondMesh.frustumCulled = false;

        const baseRadius = representation === 'licorice' ? 0.14 : 0.105;
        let instIdx = 0;
        const lookup: number[] = new Array(totalCylinders);

        for (let bIdx = 0; bIdx < molecule.bonds.length; bIdx++) {
          const bond = molecule.bonds[bIdx];
          const a = molecule.atoms[bond.atomA];
          const b = molecule.atoms[bond.atomB];
          if (!a || !b) continue;

          _vecA.set(a.x, a.y, a.z);
          _vecB.set(b.x, b.y, b.z);
          _dir.subVectors(_vecB, _vecA);
          const len = _dir.length();
          if (len < 1e-4) continue;
          _dir.divideScalar(len);

          _quat.setFromUnitVectors(_up, _dir);

          // Orthogonal vector for multi-bond offsets
          _perp.set(1, 0, 0);
          if (Math.abs(_dir.dot(_perp)) > 0.9) _perp.set(0, 0, 1);
          _perp.crossVectors(_dir, _perp).normalize();

          const strandOffsets: number[] =
            bond.order === 2 || bond.order === 1.5
              ? [-0.095, 0.095]
              : bond.order === 3
                ? [-0.14, 0, 0.14]
                : [0];

          const strandRadius =
            bond.order === 1
              ? baseRadius
              : bond.order === 3
                ? baseRadius * 0.56
                : baseRadius * 0.68;

          const colorHexA = resolveAtomColor(molecule, bond.atomA, colorScheme);
          const colorHexB = resolveAtomColor(molecule, bond.atomB, colorScheme);

          for (const off of strandOffsets) {
            _offset.copy(_perp).multiplyScalar(off);

            // Half A -> midpoint
            _mid
              .copy(_vecA)
              .addScaledVector(_dir, len * 0.25)
              .add(_offset);
            _scale.set(strandRadius, len * 0.5, strandRadius);
            _mat4.compose(_mid, _quat, _scale);
            bondMesh.setMatrixAt(instIdx, _mat4);
            _color.set(colorHexA);
            bondMesh.setColorAt(instIdx, _color);
            lookup[instIdx] = bIdx;
            instIdx++;

            // Half midpoint -> B
            _mid
              .copy(_vecA)
              .addScaledVector(_dir, len * 0.75)
              .add(_offset);
            _mat4.compose(_mid, _quat, _scale);
            bondMesh.setMatrixAt(instIdx, _mat4);
            _color.set(colorHexB);
            bondMesh.setColorAt(instIdx, _color);
            lookup[instIdx] = bIdx;
            instIdx++;
          }
        }

        bondMesh.count = instIdx;
        bondMesh.instanceMatrix.needsUpdate = true;
        if (bondMesh.instanceColor) bondMesh.instanceColor.needsUpdate = true;
        bondMesh.computeBoundingSphere();
        moleculeGroup.add(bondMesh);
        api.bondInstanced = bondMesh;
        api.bondLookup = lookup;
      }

      // 3. Procedural Molecular Surface / Electron Cloud Mesh
      if (representation === 'surface') {
        const surfGeo = buildMolecularSurfaceGeometry(molecule.atoms, colorScheme);
        const surfMat = new THREE.MeshPhysicalMaterial({
          vertexColors: true,
          roughness: 0.25,
          metalness: 0.05,
          clearcoat: 0.65,
          clearcoatRoughness: 0.18,
          transparent: true,
          opacity: 0.86,
          side: THREE.DoubleSide,
        });
        const surfMesh = new THREE.Mesh(surfGeo, surfMat);
        surfMesh.receiveShadow = !isSoftwareGl;
        moleculeGroup.add(surfMesh);

        // Subtle inner wireframe skeleton inside translucent electron cloud
        if (molecule.bonds.length > 0) {
          const linePos = new Float32Array(molecule.bonds.length * 6);
          for (let i = 0; i < molecule.bonds.length; i++) {
            const b = molecule.bonds[i];
            const a1 = molecule.atoms[b.atomA];
            const a2 = molecule.atoms[b.atomB];
            linePos[i * 6] = a1.x;
            linePos[i * 6 + 1] = a1.y;
            linePos[i * 6 + 2] = a1.z;
            linePos[i * 6 + 3] = a2.x;
            linePos[i * 6 + 4] = a2.y;
            linePos[i * 6 + 5] = a2.z;
          }
          const skelGeo = new THREE.BufferGeometry();
          skelGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
          const skelMat = new THREE.LineBasicMaterial({
            color: '#a7f3d0',
            transparent: true,
            opacity: 0.45,
          });
          const skelLines = new THREE.LineSegments(skelGeo, skelMat);
          moleculeGroup.add(skelLines);
        }
      }

      // Frame camera smoothly when switching molecules
      if (api.currentRadius !== molecule.boundingRadius) {
        api.currentRadius = molecule.boundingRadius;
        api.resetCameraToRadius(molecule.boundingRadius);
      } else {
        api.requestRender();
      }
    }, [molecule, representation, colorScheme]);

    // Reframe smoothly whenever molecule ID changes
    useEffect(() => {
      const api = sceneApiRef.current;
      if (!api) return;
      api.currentRadius = molecule.boundingRadius;
      api.resetCameraToRadius(molecule.boundingRadius);
    }, [molecule.id, molecule.boundingRadius]);

    // Update atom / bond selection highlight mesh
    useEffect(() => {
      const api = sceneApiRef.current;
      if (!api) return;

      const { highlightMesh, highlightBondMesh } = api;

      if (selectedAtomIndex !== null && molecule.atoms[selectedAtomIndex]) {
        const atom = molecule.atoms[selectedAtomIndex];
        const elInfo = getElementInfo(atom.element);
        const r =
          representation === 'space-filling'
            ? elInfo.vdwRadius * 0.96
            : representation === 'licorice'
              ? 0.23
              : Math.max(0.32, Math.min(0.7, elInfo.covalentRadius * 0.64));
        highlightMesh.position.set(atom.x, atom.y, atom.z);
        highlightMesh.scale.setScalar(r);
        highlightMesh.visible = true;
      } else {
        highlightMesh.visible = false;
      }

      if (selectedBondIndex !== null && molecule.bonds[selectedBondIndex]) {
        const bond = molecule.bonds[selectedBondIndex];
        const a = molecule.atoms[bond.atomA];
        const b = molecule.atoms[bond.atomB];
        if (a && b) {
          _vecA.set(a.x, a.y, a.z);
          _vecB.set(b.x, b.y, b.z);
          _mid.addVectors(_vecA, _vecB).multiplyScalar(0.5);
          _dir.subVectors(_vecB, _vecA);
          const len = _dir.length();
          _dir.divideScalar(len || 1);
          highlightBondMesh.position.copy(_mid);
          highlightBondMesh.quaternion.setFromUnitVectors(_up, _dir);
          highlightBondMesh.scale.set(0.24, len, 0.24);
          highlightBondMesh.visible = true;
        }
      } else {
        highlightBondMesh.visible = false;
      }

      api.requestRender();
    }, [selectedAtomIndex, selectedBondIndex, molecule, representation]);

    return (
      <div className="relative h-full w-full select-none bg-[radial-gradient(circle_at_45%_45%,#04110B_0%,#020705_70%)]">
        <div ref={mountRef} className="h-full w-full" />
        {contextLost && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#020705]/90">
            <p className="rounded-lg border border-emerald-600/25 bg-[#040C09] px-4 py-2 text-xs text-emerald-100">
              {webglLostLabel}
            </p>
          </div>
        )}
      </div>
    );
  },
);
