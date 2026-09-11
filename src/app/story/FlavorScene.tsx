import { useEffect, useRef, useState, type RefObject } from "react";
import mustardPhoto from "@/assets/jar_mustard_studio.jpg";
import tapenadePhoto from "@/assets/story_tapenade.webp";

type Flavor = "mustard" | "tapenade";

export default function FlavorScene({
  flavor,
  motion,
  section,
  onAvailability,
}: {
  flavor: Flavor;
  motion: boolean;
  section: RefObject<HTMLElement>;
  onAvailability: (available: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const update = useRef<(() => void) | null>(null);
  const flavorRef = useRef(flavor);
  const [ready, setReady] = useState(false);
  flavorRef.current = flavor;

  useEffect(() => {
    update.current?.();
  }, [flavor]);

  useEffect(() => {
    const el = host.current;
    if (!el || !motion) {
      setReady(false);
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const mount = async () => {
      try {
        const T = await import("three");
        if (cancelled) return;

        const renderer = new T.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, innerWidth < 700 ? 1 : 1.5),
        );
        renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.55;
        el.appendChild(renderer.domElement);

        const scene = new T.Scene();
        const camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
        camera.position.set(0, 1.55, 9.4);
        camera.lookAt(0, 0.6, 0);
        scene.add(new T.HemisphereLight(0xfff3d4, 0x52644b, 3));
        const key = new T.DirectionalLight(0xffe2a4, 5);
        key.position.set(-3, 5, 4);
        scene.add(key);
        const rim = new T.DirectionalLight(0xf4ffe8, 2.5);
        rim.position.set(4, 2, -2);
        scene.add(rim);
        const frontFill = new T.DirectionalLight(0xf8fbf7, 1.8);
        frontFill.position.set(0, 2.5, 8);
        scene.add(frontFill);

        const world = new T.Group();
        scene.add(world);

        // The spoon is built from a shallow lathed bowl and one curved handle.
        const bowlProfile = Array.from({ length: 25 }, (_, i) => {
          const r = i / 24;
          return new T.Vector2(r * 0.88, 0.28 * r * r);
        });
        const spoonMat = new T.MeshPhysicalMaterial({
          color: 0xd8dedc,
          metalness: 0.84,
          roughness: 0.18,
          clearcoat: 0.7,
          clearcoatRoughness: 0.1,
          side: T.DoubleSide,
        });
        const bowl = new T.Mesh(new T.LatheGeometry(bowlProfile, 64), spoonMat);
        bowl.scale.z = 1.4;
        const spoon = new T.Group();
        spoon.add(bowl);
        const handlePath = new T.CatmullRomCurve3([
          new T.Vector3(0, 0.25, 1.06),
          new T.Vector3(0, 0.29, 1.6),
          new T.Vector3(0, 0.37, 2.5),
          new T.Vector3(0.12, 0.44, 3.7),
        ]);
        const handle = new T.Mesh(
          new T.TubeGeometry(handlePath, 36, 0.1, 10, false),
          spoonMat,
        );
        handle.scale.x = 1.5;
        spoon.add(handle);
        spoon.rotation.set(0.04, 0, 0);
        spoon.position.set(-0.15, -0.45, -0.65);
        world.add(spoon);

        const sauceMat = new T.MeshStandardMaterial({
          color: 0xb67d1e,
          roughness: 0.42,
          metalness: 0.02,
        });
        const fillMat = sauceMat.clone();
        fillMat.transparent = true;
        fillMat.depthWrite = false;
        const fill = new T.Mesh(new T.SphereGeometry(1, 24, 14), fillMat);
        fill.position.set(0, 0.17, 0.02);
        fill.scale.set(0.66, 0.06, 0.88);
        fill.visible = false;
        spoon.add(fill);

        // A small label makes the animated jar read as the same object as the product shot.
        const labelCanvas = document.createElement("canvas");
        labelCanvas.width = 320;
        labelCanvas.height = 150;
        const labelCtx = labelCanvas.getContext("2d");
        if (labelCtx) {
          labelCtx.fillStyle = "#f4e6cd";
          labelCtx.fillRect(0, 0, 320, 150);
          labelCtx.fillStyle = "#c55032";
          labelCtx.font = "700 48px sans-serif";
          labelCtx.textAlign = "center";
          labelCtx.fillText("きみえ", 160, 68);
          labelCtx.fillStyle = "#1f4836";
          labelCtx.font = "500 16px sans-serif";
          labelCtx.fillText("瓶詰めの台所", 160, 105);
        }
        const labelTexture = new T.CanvasTexture(labelCanvas);
        labelTexture.colorSpace = T.SRGBColorSpace;
        const labelMat = new T.MeshBasicMaterial({
          map: labelTexture,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        });

        const jarBodyMat = new T.MeshStandardMaterial({
          color: 0x9a7022,
          roughness: 0.34,
          metalness: 0.03,
        });
        const jarLidMat = new T.MeshStandardMaterial({
          color: 0xead4b3,
          roughness: 0.58,
          metalness: 0.08,
        });
        const jar = new T.Group();
        const jarBody = new T.Mesh(
          new T.CylinderGeometry(0.7, 0.78, 1.42, 48),
          jarBodyMat,
        );
        jar.add(jarBody);
        const shoulder = new T.Mesh(
          new T.CylinderGeometry(0.54, 0.7, 0.25, 48),
          jarBodyMat,
        );
        shoulder.position.y = 0.8;
        jar.add(shoulder);
        const neck = new T.Mesh(
          new T.CylinderGeometry(0.35, 0.42, 0.32, 40),
          jarBodyMat,
        );
        neck.position.y = 1.06;
        jar.add(neck);
        const lid = new T.Mesh(
          new T.CylinderGeometry(0.45, 0.45, 0.16, 40),
          jarLidMat,
        );
        lid.position.y = 1.28;
        jar.add(lid);
        const label = new T.Mesh(new T.PlaneGeometry(0.86, 0.4), labelMat);
        label.position.set(0, -0.03, 0.8);
        label.renderOrder = 2;
        jar.add(label);
        jar.scale.setScalar(0.92);
        jar.position.set(1.05, 2.55, -0.35);
        world.add(jar);

        const streamCurve = new T.CatmullRomCurve3([
          new T.Vector3(0, 0, 0),
          new T.Vector3(0.02, -0.48, 0.01),
          new T.Vector3(-0.02, -1, 0),
        ]);
        const stream = new T.Mesh(
          new T.TubeGeometry(streamCurve, 18, 0.072, 10, false),
          sauceMat,
        );
        stream.renderOrder = 3;
        sauceMat.depthTest = false;
        sauceMat.depthWrite = false;
        stream.visible = false;
        const pour = new T.Group();
        pour.add(stream);
        world.add(pour);

        const seedMat = new T.MeshStandardMaterial({
          color: 0xc79127,
          roughness: 0.6,
          metalness: 0.1,
        });
        const oliveMat = new T.MeshStandardMaterial({
          color: 0x333222,
          roughness: 0.31,
          metalness: 0.05,
        });
        const seeds = new T.InstancedMesh(
          new T.SphereGeometry(1, 12, 8),
          seedMat,
          72,
        );
        const olives = new T.InstancedMesh(
          new T.SphereGeometry(1, 16, 12),
          oliveMat,
          22,
        );
        seeds.frustumCulled = olives.frustumCulled = false;
        world.add(seeds, olives);

        const leafMat = new T.MeshStandardMaterial({
          color: 0x819c45,
          roughness: 0.75,
          side: T.DoubleSide,
        });
        const leafShape = new T.Shape();
        leafShape.moveTo(0, -0.55);
        leafShape.bezierCurveTo(-0.4, -0.1, -0.35, 0.3, 0, 0.55);
        leafShape.bezierCurveTo(0.35, 0.3, 0.4, -0.1, 0, -0.55);
        const leaves = new T.InstancedMesh(
          new T.ShapeGeometry(leafShape, 12),
          leafMat,
          7,
        );
        leaves.frustumCulled = false;
        world.add(leaves);

        const dummy = new T.Object3D();
        const mouth = new T.Vector3();
        const target = new T.Vector3();
        const direction = new T.Vector3();
        const down = new T.Vector3(0, -1, 0);
        const rand = (i: number, offset = 0) => {
          const n = Math.sin(i * 127.1 + offset * 311.7) * 43758.5453;
          return n - Math.floor(n);
        };
        let frame = 0;
        let progress = 0;
        let desired = 0;
        let active = false;
        let pointerX = 0;
        let pointerY = 0;
        let px = 0;
        let py = 0;
        let lost = false;
        let lastFlavor = flavorRef.current;

        const readProgress = () => {
          const rect = section.current?.getBoundingClientRect();
          if (rect) {
            desired = T.MathUtils.clamp(
              -rect.top / Math.max(1, rect.height - innerHeight),
              0,
              1,
            );
          }
        };

        const draw = () => {
          frame = 0;
          if (cancelled || lost || !active || document.hidden) return;
          progress = T.MathUtils.lerp(progress, desired, 0.14);
          px = T.MathUtils.lerp(px, pointerX, 0.1);
          py = T.MathUtils.lerp(py, pointerY, 0.1);

          const tapenade = flavorRef.current === "tapenade";
          const approach = T.MathUtils.smoothstep(progress, 0.02, 0.25);
          const tilt = T.MathUtils.smoothstep(progress, 0.2, 0.42);
          const pourAmount = T.MathUtils.smoothstep(progress, 0.3, 0.68);
          const collect = T.MathUtils.smoothstep(progress, 0.58, 0.9);
          const settle = T.MathUtils.smoothstep(progress, 0.78, 1);

          sauceMat.color.setHex(tapenade ? 0x3d3a2b : 0xb67d1e);
          fillMat.color.copy(sauceMat.color);
          jarBodyMat.color.setHex(tapenade ? 0x454437 : 0x9a7022);
          seedMat.color.setHex(tapenade ? 0x5f6047 : 0xc79127);
          lid.visible = tilt < 0.2;
          stream.visible = pourAmount > 0.015;
          fill.visible = collect > 0.015;
          fillMat.opacity = 0.15 + collect * 0.72;

          jar.position.x = T.MathUtils.lerp(1.05, 0.2, approach);
          jar.position.y = T.MathUtils.lerp(2.55, 2.35, approach);
          jar.position.z = -0.35 - approach * 0.15;
          jar.rotation.z = -tilt * 0.95;
          jar.rotation.y = px * 0.08;
          jar.updateMatrixWorld(true);
          mouth.set(0, 1.39, 0).applyMatrix4(jar.matrixWorld);

          spoon.updateMatrixWorld(true);
          target.set(0, 0.16, 0.02).applyMatrix4(spoon.matrixWorld);
          direction.copy(target).sub(mouth);
          const length = direction.length();
          direction.normalize();
          pour.position.copy(mouth);
          pour.quaternion.setFromUnitVectors(down, direction);
          stream.scale.set(1, length * pourAmount, 1);

          const pieces = tapenade ? olives : seeds;
          seeds.visible = !tapenade;
          olives.visible = tapenade;
          for (let i = 0; i < pieces.count; i++) {
            const pathT = (rand(i, 1) * 0.88 + progress * 0.18) % 1;
            const path = mouth.clone().lerp(target, pathT * pourAmount);
            const settlePoint = target
              .clone()
              .add(
                new T.Vector3(
                  (rand(i, 2) - 0.5) * 0.82,
                  (rand(i, 3) - 0.45) * 0.14,
                  (rand(i, 4) - 0.5) * 0.45,
                ),
              );
            path.lerp(settlePoint, collect);
            path.y += Math.sin(progress * 8 + i) * (1 - collect) * 0.08;
            dummy.position.copy(path);
            dummy.rotation.set(i + progress, i * 0.8 + progress * 1.5, i * 0.3);
            const size = tapenade
              ? 0.13 + rand(i, 5) * 0.1
              : 0.032 + rand(i, 5) * 0.038;
            dummy.scale.set(size, size * (tapenade ? 1.25 : 1), size);
            dummy.updateMatrix();
            pieces.setMatrixAt(i, dummy.matrix);
          }
          pieces.instanceMatrix.needsUpdate = true;

          for (let i = 0; i < leaves.count; i++) {
            const a = i * 2.4;
            dummy.position.set(
              target.x + Math.cos(a) * (0.55 + settle * 0.15),
              target.y + 0.1 + Math.sin(a) * 0.12,
              target.z + Math.sin(a) * 0.5,
            );
            dummy.rotation.set(0.4 + progress, a, a * 0.4 + progress * 0.4);
            dummy.scale.setScalar(0.08 + settle * 0.18);
            dummy.updateMatrix();
            leaves.setMatrixAt(i, dummy.matrix);
          }
          leaves.instanceMatrix.needsUpdate = true;

          spoon.rotation.set(0.04, 0, 0);
          fill.scale.y = 0.04 + collect * 0.08;
          world.rotation.y = px * 0.12;
          world.rotation.x = py * 0.06;
          renderer.render(scene, camera);
          el.dataset.progress = progress.toFixed(3);
          el.dataset.flavor = flavorRef.current;

          if (
            Math.abs(progress - desired) > 0.0003 ||
            Math.abs(px - pointerX) > 0.001 ||
            Math.abs(py - pointerY) > 0.001
          ) {
            schedule();
          }
          lastFlavor = flavorRef.current;
        };

        const schedule = () => {
          if (!frame && active && !document.hidden && !lost) {
            frame = requestAnimationFrame(draw);
          }
        };
        const scroll = () => {
          readProgress();
          schedule();
        };
        const resize = () => {
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.position.z = w / h < 1 ? 11.5 : 9.4;
          camera.updateProjectionMatrix();
          scroll();
        };
        const pointer = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          const rect = el.getBoundingClientRect();
          pointerX = (e.clientX - rect.left) / rect.width - 0.5;
          pointerY = (e.clientY - rect.top) / rect.height - 0.5;
          schedule();
        };
        const resetPointer = () => {
          pointerX = 0;
          pointerY = 0;
          schedule();
        };
        const visibility = () => {
          if (document.hidden) {
            cancelAnimationFrame(frame);
            frame = 0;
          } else {
            scroll();
          }
        };
        const contextLost = (e: Event) => {
          e.preventDefault();
          lost = true;
          cancelAnimationFrame(frame);
          frame = 0;
          setReady(false);
          onAvailability(false);
        };
        const observer = new IntersectionObserver(
          ([entry]) => {
            active = entry.isIntersecting;
            if (active) {
              readProgress();
              if (lastFlavor !== flavorRef.current) progress = desired;
              schedule();
            } else {
              cancelAnimationFrame(frame);
              frame = 0;
            }
          },
          { rootMargin: "120px" },
        );
        observer.observe(el);
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        window.addEventListener("scroll", scroll, { passive: true });
        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", visibility);
        el.addEventListener("pointermove", pointer);
        el.addEventListener("pointerleave", resetPointer);
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        update.current = schedule;
        resize();
        setReady(true);
        onAvailability(true);

        cleanup = () => {
          observer.disconnect();
          ro.disconnect();
          cancelAnimationFrame(frame);
          window.removeEventListener("scroll", scroll);
          window.removeEventListener("resize", resize);
          document.removeEventListener("visibilitychange", visibility);
          el.removeEventListener("pointermove", pointer);
          el.removeEventListener("pointerleave", resetPointer);
          renderer.domElement.removeEventListener(
            "webglcontextlost",
            contextLost,
          );
          const geometries = new Set<import("three").BufferGeometry>();
          const materials = new Set<import("three").Material>();
          scene.traverse((obj) => {
            if (obj instanceof T.Mesh || obj instanceof T.InstancedMesh) {
              geometries.add(obj.geometry);
              (Array.isArray(obj.material)
                ? obj.material
                : [obj.material]
              ).forEach((material) => materials.add(material));
            }
          });
          geometries.forEach((geometry) => geometry.dispose());
          materials.forEach((material) => material.dispose());
          labelTexture.dispose();
          renderer.dispose();
          renderer.domElement.remove();
          update.current = null;
        };
      } catch {
        if (!cancelled) {
          setReady(false);
          onAvailability(false);
        }
      }
    };

    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          near.disconnect();
          void mount();
        }
      },
      { rootMargin: "400px" },
    );
    near.observe(el);

    return () => {
      cancelled = true;
      near.disconnect();
      cleanup?.();
      setReady(false);
    };
  }, [motion, section, onAvailability]);

  return (
    <div
      className={`ks-scene ${ready ? "is-ready" : ""}`}
      ref={host}
      aria-hidden="true"
    >
      <img
        className="ks-scene-fallback"
        src={flavor === "mustard" ? mustardPhoto : tapenadePhoto}
        alt=""
      />
    </div>
  );
}
