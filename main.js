import * as THREE from 'three';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';

const startWhiplashSite = () => {
    const pageLoader = setupPageLoader();
    setupReveal();
    setupNav();
    setupMobileDesktopNotice();
    setupVideoModal();
    setupGifModal();
    setupParticleStream();
    setupModel(pageLoader);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhiplashSite, { once: true });
} else {
    startWhiplashSite();
}

function setupPageLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return { setPageReady() {}, setCharactersReady() {} };

    document.body.classList.add('is-loading');

    const media = loader.querySelector('[data-loader-gif]');
    const gifPath = media?.dataset.loaderGif?.trim();
    if (media && gifPath) {
        const image = new Image();
        image.className = 'loader-gif';
        image.alt = '';
        image.decoding = 'async';
        image.onload = () => {
            media.replaceChildren(image);
        };
        image.src = gifPath;
    }

    const startedAt = performance.now();
    let hideScheduled = false;
    let pageReady = document.readyState === 'complete';
    let charactersReady = false;

    const hideLoader = () => {
        if (hideScheduled) return;
        if (!pageReady || !charactersReady) return;
        hideScheduled = true;

        const elapsed = performance.now() - startedAt;
        const delay = Math.max(0, 1200 - elapsed);
        window.setTimeout(() => {
            loader.classList.add('is-hidden');
            loader.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('is-loading');
            window.setTimeout(() => loader.remove(), 650);
        }, delay);
    };

    const setPageReady = () => {
        pageReady = true;
        hideLoader();
    };

    const setCharactersReady = () => {
        charactersReady = true;
        hideLoader();
    };

    if (pageReady) {
        setPageReady();
    } else {
        window.addEventListener('load', setPageReady, { once: true });
    }

    window.setTimeout(() => {
        pageReady = true;
        charactersReady = true;
        hideLoader();
    }, 9000);

    return { setPageReady, setCharactersReady };
}

function setupMobileDesktopNotice() {
    const notice = document.getElementById('mobile-desktop-notice');
    if (!notice) return;

    const closeButton = notice.querySelector('[data-mobile-notice-close]');
    const mobileQuery = window.matchMedia('(max-width: 760px)');
    const storageKey = 'whiplashDesktopNoticeDismissed';

    const getDismissed = () => {
        try {
            return sessionStorage.getItem(storageKey) === 'true';
        } catch {
            return false;
        }
    };

    let dismissed = getDismissed();

    const setVisible = (visible) => {
        notice.hidden = !visible;
        notice.classList.toggle('is-visible', visible);
    };

    const updateNotice = () => {
        setVisible(mobileQuery.matches && !dismissed);
    };

    closeButton?.addEventListener('click', () => {
        dismissed = true;
        try {
            sessionStorage.setItem(storageKey, 'true');
        } catch {
            // Session storage can be unavailable in strict privacy modes.
        }
        setVisible(false);
    });

    if (typeof mobileQuery.addEventListener === 'function') {
        mobileQuery.addEventListener('change', updateNotice);
    } else if (typeof mobileQuery.addListener === 'function') {
        mobileQuery.addListener(updateNotice);
    }

    updateNotice();
}

function setupReveal() {
    const targets = [
        '.section-label',
        'h2',
        '.framework-copy > p',
        '.framework-flow span',
        '.framework-points article',
        '.section-heading p',
        '.system-card',
        '.gif-card',
        '.video-card',
        '.bullet-panel',
        '.wide-bullets',
        '.stack-list span',
        '.stack-list a'
    ];

    targets.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => el.classList.add('reveal'));
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.14 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

function setupNav() {
    let lastScroll = 0;
    const nav = document.getElementById('nav');

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        nav.style.transform = currentScroll > lastScroll && currentScroll > 120
            ? 'translateY(-100%)'
            : 'translateY(0)';
        lastScroll = currentScroll;
    }, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function setupVideoModal() {
    const modal = document.getElementById('video-modal');
    const frameWrap = document.getElementById('video-frame-wrap');
    const triggers = document.querySelectorAll('[data-youtube-id]');
    if (!modal || !frameWrap) return;

    const emptyMarkup = frameWrap.innerHTML;

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        frameWrap.innerHTML = emptyMarkup;
    };

    triggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
            const videoId = trigger.dataset.youtubeId?.trim();
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');

            if (videoId) {
                frameWrap.innerHTML = `
                    <iframe
                        src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0"
                        title="Whiplash gameplay showcase"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen>
                    </iframe>
                `;
            } else {
                frameWrap.innerHTML = emptyMarkup;
            }
        });
    });

    document.querySelectorAll('[data-close-video]').forEach((closeButton) => {
        closeButton.addEventListener('click', closeModal);
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal();
        }
    });
}

function setupGifModal() {
    const modal = document.getElementById('gif-modal');
    const gifImage = document.getElementById('gif-modal-image');
    const triggers = document.querySelectorAll('[data-gif-modal]');
    if (!modal || !gifImage || !triggers.length) return;

    const openModal = (trigger) => {
        const gifSrc = trigger.dataset.gifSrc?.trim() || '';
        if (!gifSrc) return;

        gifImage.alt = trigger.getAttribute('aria-label') || 'Expanded GIF preview';
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        gifImage.src = gifSrc;
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        gifImage.removeAttribute('src');
    };

    triggers.forEach((trigger) => {
        trigger.addEventListener('click', () => openModal(trigger));
        trigger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openModal(trigger);
            }
        });
    });

    document.querySelectorAll('[data-close-gif]').forEach((closeButton) => {
        closeButton.addEventListener('click', closeModal);
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal();
        }
    });
}

function setupParticleStream() {
    const canvas = document.getElementById('hero-particles');
    const hero = document.getElementById('hero');
    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d');
    const palette = ['#ff5a00', '#f24800', '#b83a00', '#8acbc2', '#91d3cb', '#74a9a1', '#ff8a35', '#fffdf7'];
    const particles = [];
    const count = 900;
    let width = 1;
    let height = 1;
    let lastTime = performance.now();

    const makeParticle = (resetToLeft = false) => ({
        x: resetToLeft ? -Math.random() * width * 0.18 : Math.random() * width,
        y: height * (0.12 + Math.random() * 0.72),
        radius: 0.7 + Math.random() * 1.25,
        speed: 18 + Math.random() * 46,
        wave: 10 + Math.random() * 32,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.28 + Math.random() * 0.5,
        color: palette[Math.floor(Math.random() * palette.length)]
    });

    const resize = () => {
        const rect = hero.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        canvas.width = Math.floor(width * pixelRatio);
        canvas.height = Math.floor(height * pixelRatio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        particles.length = 0;
        for (let i = 0; i < count; i += 1) {
            particles.push(makeParticle(false));
        }
    };

    const render = (time) => {
        const delta = Math.min((time - lastTime) / 1000, 0.04);
        lastTime = time;

        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'lighter';

        particles.forEach((particle) => {
            particle.x += particle.speed * delta;
            particle.phase += delta * 1.2;

            if (particle.x > width + 24) {
                Object.assign(particle, makeParticle(true));
            }

            const y = particle.y + Math.sin(particle.phase + particle.x * 0.008) * particle.wave;
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        requestAnimationFrame(render);
    };

    window.addEventListener('resize', resize, { passive: true });
    resize();
    requestAnimationFrame(render);
}

function setupModel(pageLoader) {
    const canvas = document.getElementById('hero-model');
    if (!canvas) {
        pageLoader?.setCharactersReady();
        return;
    }

    // Mobile version: keep the Three.js character code disabled so phones do not load or show GLB characters.
    const disableCharactersOnMobile = window.matchMedia('(max-width: 760px)').matches;
    if (disableCharactersOnMobile) {
        canvas.closest('.hero-model-wrap')?.setAttribute('hidden', '');
        pageLoader?.setCharactersReady();
        return;
    }

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    let heroCameraViewHeight = 11.5;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    camera.position.set(0, 1.2, 14);
    camera.lookAt(0, 0, 0);

    const keyLight = new THREE.DirectionalLight(0xff8a35, 3.8);
    keyLight.position.set(0.4, 4.8, 7.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -16;
    keyLight.shadow.camera.right = 16;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 32;
    keyLight.shadow.bias = -0.00035;
    scene.add(keyLight);
    const keyLightTarget = new THREE.Object3D();
    keyLightTarget.position.set(0.2, 0.1, -1.6);
    scene.add(keyLightTarget);
    keyLight.target = keyLightTarget;

    const fillLight = new THREE.DirectionalLight(0x8acbc2, 2.6);
    fillLight.position.set(-4, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
    rimLight.position.set(-2.5, 5, -3.5);
    scene.add(rimLight);

    const bounceLight = new THREE.PointLight(0xfff4df, 1.35, 9, 1.8);
    bounceLight.position.set(0.6, -0.35, 3.2);
    scene.add(bounceLight);

    const sideAccentLight = new THREE.DirectionalLight(0xff8a35, 1.15);
    sideAccentLight.position.set(5.2, 2.2, 2.6);
    scene.add(sideAccentLight);

    scene.add(new THREE.HemisphereLight(0xfff4df, 0x74a9a1, 1.65));

    // Traversal-associated receiver plane disabled.
    // const whiplashHeaderShadowPlane = new THREE.Mesh(
    //     new THREE.PlaneGeometry(1, 1),
    //     new THREE.ShadowMaterial({
    //         color: 0x1e1a17,
    //         opacity: 0.22,
    //         transparent: true
    //     })
    // );
    // whiplashHeaderShadowPlane.name = 'WhiplashHeaderShadowPlane';
    // whiplashHeaderShadowPlane.receiveShadow = true;
    // whiplashHeaderShadowPlane.frustumCulled = false;
    // whiplashHeaderShadowPlane.material.depthWrite = false;
    // scene.add(whiplashHeaderShadowPlane);

    const stageRoot = new THREE.Group();
    stageRoot.position.set(0.42, 0.56, 0);
    scene.add(stageRoot);

    const characterRoots = [];
    const shadowPlaneRecords = [];
    const createCharacterRoot = ({
        x = 0,
        y = 0,
        z = 0,
        yaw = -0.22,
        yawStrength = 1,
        pitchStrength = 1,
        rotationEase = 0.22
    }) => {
        const root = new THREE.Group();
        root.position.set(x, y, z);
        root.rotation.y = yaw;
        stageRoot.add(root);
        characterRoots.push({ root, baseYaw: yaw, yawStrength, pitchStrength, rotationEase });
        return root;
    };

    const createCharacterShadowPlane = ({
        name,
        root,
        width = 8,
        depth = 5,
        offsetX = 0,
        offsetY = -1.1,
        offsetZ = -1.35,
        rotationX = -Math.PI / 2,
        rotationY = 0,
        rotationZ = 0,
        opacity = 0.24
    }) => {
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(width, depth),
            new THREE.ShadowMaterial({
                color: 0x1e1a17,
                opacity,
                transparent: true
            })
        );
        plane.name = name;
        plane.rotation.set(rotationX, rotationY, rotationZ);
        plane.position.set(
            root.position.x + offsetX,
            root.position.y + offsetY,
            root.position.z + offsetZ
        );
        plane.receiveShadow = true;
        stageRoot.add(plane);
        shadowPlaneRecords.push({
            plane,
            root,
            offsetX,
            offsetY,
            offsetZ
        });
        return plane;
    };

    const runRoot = createCharacterRoot({ x: 4, z: -0.58, yaw: -0.18, yawStrength: 0.28, pitchStrength: 0.35, rotationEase: 0.07 });
    const slideRoot = createCharacterRoot({ x: 8, z: -0.84, yaw: THREE.MathUtils.degToRad(-40), yawStrength: 0.28, pitchStrength: 0.35, rotationEase: 0.07 });
    const characterRoot = createCharacterRoot({ x: 6,y: 0, z: 0.36, yaw: -0.22, yawStrength: 0.95, pitchStrength: 0.85, rotationEase: 0.22 });
    const traversalRoot = createCharacterRoot({ x: -6.25, y: 1.411, z: 0.05, yaw: THREE.MathUtils.degToRad(8), yawStrength: 0, pitchStrength: 3.2, rotationEase: 0.09 });

    const sharedCharacterShadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(18, 18),
        new THREE.ShadowMaterial({
            color: 0x1e1a17,
            opacity: 0.24,
            transparent: true
        })
    );
    sharedCharacterShadowPlane.name = 'SharedCharacterShadowPlane';
    sharedCharacterShadowPlane.rotation.x = -Math.PI / 2;
    sharedCharacterShadowPlane.position.set(6, -1.65, -3.4);
    sharedCharacterShadowPlane.receiveShadow = true;
    stageRoot.add(sharedCharacterShadowPlane);

    // Replaced by SharedCharacterShadowPlane to avoid overlapping receiver shadows.
    // const runShadowPlane = createCharacterShadowPlane({
    //     name: 'RunShadowPlane',
    //     root: runRoot,
    //     offsetX: 0,
    //
    // });
    // const slideShadowPlane = createCharacterShadowPlane({
    //     name: 'SlideShadowPlane',
    //     root: slideRoot,
    //     offsetX: 0,
    //
    // });
    // const characterShadowPlane = createCharacterShadowPlane({
    //     name: 'CharacterShadowPlane',
    //     root: characterRoot,
    //     width: 10,
    //     depth: 6
    // });
    // Traversal-associated receiver plane disabled.
    // const traversalShadowPlane = createCharacterShadowPlane({
    //     name: 'TraversalShadowPlane',
    //     root: traversalRoot,
    //     width: 1.5,
    //     depth: 1.5,
    //     rotationX: 0,
    //     offsetX: 0,
    //     offsetY: -1.4,
    //     offsetZ: -2.0
    // });

    const sceneLayouts = {
        desktop: {
            cameraHeight: 11.5,
            run: { x: 3, y: -0.6, z: -0.58, scale: 1.8, visible: true },
            slide: { x: 9, y: -1.1, z: -0.84, scale: 1.2, visible: true },
            character: { x: 6, y: 0, z: 0.36, scale: 1, visible: true },
            traversal: { x: -4.5, y: 1.1, z: 0.05, scale: 1, visible: true }
        },
        tablet: {
            cameraHeight: 13.5,
            run: { x: 2.4, y: -0.15, z: -0.58, scale: 0.78, visible: true },
            slide: { x: 5.0, y: -0.2, z: -0.84, scale: 0.78, visible: true },
            character: { x: 3.5, y: -0.35, z: 0.36, scale: 0.82, visible: true },
            traversal: { x: -2.8, y: 1.9, z: 0.05, scale: 0.9, visible: true }
        },
        mobile: {
            cameraHeight: 13.5,
            run: { visible: false },
            slide: { visible: false },
            character: { visible: false },
            traversal: { x: -1.6, y: 2.0, z: 0.05, scale: 0.76, visible: true }
        }
    };

    const sceneCharacters = {
        run: runRoot,
        slide: slideRoot,
        character: characterRoot,
        traversal: traversalRoot
    };

    const getSceneLayout = () => {
        if (window.innerWidth <= 640) return sceneLayouts.mobile;
        if (window.innerWidth <= 980) return sceneLayouts.tablet;
        return sceneLayouts.desktop;
    };

    const applySceneLayout = (layout, canvasRect) => {
        Object.entries(sceneCharacters).forEach(([key, root]) => {
            const item = layout[key];
            const visible = item?.visible !== false;
            root.visible = visible;
            if (!visible) return;

            if (item.anchor && canvasRect) {
                const anchor = stageRoot.worldToLocal(getWorldAnchorFromElement(item.anchor, item.anchorX, item.anchorY, canvasRect, item.z ?? 0));
                root.position.set(
                    anchor.x + (item.offsetX ?? 0),
                    anchor.y + (item.offsetY ?? 0),
                    anchor.z
                );
            } else {
                root.position.set(item.x, item.y ?? 0, item.z ?? 0);
            }
            root.scale.setScalar(item.scale ?? 1);

            if (root === traversalRoot) {
                root.userData.baseY = root.position.y;
            }
        });

        shadowPlaneRecords.forEach(({ plane, root, offsetX, offsetY, offsetZ }) => {
            plane.visible = root.visible;
            if (!root.visible) return;

            plane.position.set(
                root.position.x + offsetX,
                root.position.y + offsetY,
                root.position.z + offsetZ
            );
        });
    };

    const getWorldAnchorFromElement = (selector, anchorX, anchorY, canvasRect, targetZ) => {
        const element = document.querySelector(selector);
        if (!element) return new THREE.Vector3(0, 0, targetZ);

        const rect = element.getBoundingClientRect();
        return screenToWorld(
            rect.left + rect.width * anchorX,
            rect.top + rect.height * anchorY,
            canvasRect,
            targetZ
        );
    };

    let targetYaw = -0.22;
    let targetPitch = 0;
    let scrollPitch = 0;
    let traversalScrollDrop = 0;
    const mixers = [];
    const clock = new THREE.Clock();
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const loader = new GLTFLoader();

    const loadCharacter = ({ path, root, height, verticalOffset = 0.42, fallback = false, castShadow = true, removeNodes = [], playAnimation = true }) => new Promise((resolve) => {
        loader.load(
            path,
            (gltf) => {
                const character = gltf.scene;

                if (removeNodes.length > 0) {
                    const nodesToRemove = [];
                    character.traverse((child) => {
                        if (removeNodes.some((name) => child.name.includes(name))) {
                            nodesToRemove.push(child);
                        }
                    });
                    nodesToRemove.forEach((node) => {
                        if (node.parent) node.parent.remove(node);
                    });
                }

                normalizeModel(character, height);
                character.traverse((child) => {
                    if (!child.isMesh) return;
                    child.frustumCulled = false;
                    child.castShadow = castShadow;
                });
                character.position.y += verticalOffset;
                root.add(character);

                if (playAnimation && gltf.animations && gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(character);
                    mixer.clipAction(gltf.animations[0]).play();
                    mixers.push(mixer);
                }

                resolve({ path, ok: true });
            },
            undefined,
            () => {
                if (fallback) createFallbackFigure(root);
                resolve({ path, ok: false });
            }
        );
    });

    const characterLoadPromises = [
    loadCharacter({
        path: './assets/CharacterTraversalNoPistol.glb',
        root: traversalRoot,
        height: 2.82 * 0.62,
        verticalOffset: 0.36,
        castShadow: true,
        playAnimation: false,
        removeNodes: ['SuperGrid_Box']
    }),
    loadCharacter({
        path: './assets/CharacterRunWithPistol.glb',
        root: runRoot,
        height: 2.82 * 0.7,
        verticalOffset: 0.3,
        castShadow: true
    }),
    loadCharacter({
        path: './assets/CharacterSlideWithPistol.glb',
        root: slideRoot,
        height: 2.82 * 0.7,
        verticalOffset: 0.3,
        castShadow: true
    }),
    loadCharacter({
        path: './assets/CharacterWithPistol.glb',
        root: characterRoot,
        height: 2.82 * 2,
        verticalOffset: 0.5,
        fallback: true
    })
    ];

    Promise.allSettled(characterLoadPromises).then(() => {
        pageLoader?.setCharactersReady();
    });

    const updateModelRotationFromPointer = (event) => {
            const x = event.clientX / window.innerWidth - 0.5;
            const y = event.clientY / window.innerHeight - 0.5;
            targetYaw = -0.22 + x * 0.68;
            targetPitch = y * 0.04;
    };

    const updateTraversalPitchFromScroll = () => {
        scrollPitch = THREE.MathUtils.clamp(window.scrollY * 0.0007, -0.22, 0.22);
        traversalScrollDrop = THREE.MathUtils.clamp(window.scrollY * 0.000275, 0, 0.225);
    };

    window.addEventListener('pointermove', updateModelRotationFromPointer, { passive: true });
    window.addEventListener('mousemove', updateModelRotationFromPointer, { passive: true });
    window.addEventListener('scroll', updateTraversalPitchFromScroll, { passive: true });
    updateTraversalPitchFromScroll();

    function render() {
        const delta = clock.getDelta();
        mixers.forEach((mixer) => mixer.update(delta));

        if (!isFinePointer && !reduceMotion) {
            targetYaw += delta * 0.08;
        }

        const yawDelta = targetYaw - -0.22;
        const traversalBaseY = traversalRoot.userData.baseY ?? traversalRoot.position.y;
        const traversalTargetY = traversalBaseY - traversalScrollDrop;
        traversalRoot.position.y += (traversalTargetY - traversalRoot.position.y) * 0.08;

        characterRoots.forEach(({ root, baseYaw, yawStrength, pitchStrength, rotationEase }) => {
            const yawTarget = baseYaw + yawDelta * yawStrength;
            const pitchTarget = (root === traversalRoot ? scrollPitch : targetPitch) * pitchStrength;
            root.rotation.y += (yawTarget - root.rotation.y) * rotationEase;
            root.rotation.x += (pitchTarget - root.rotation.x) * (rotationEase * 0.82);
        });
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    function resize() {
        const layout = getSceneLayout();
        heroCameraViewHeight = layout.cameraHeight;
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        const aspect = width / height;
        renderer.setSize(width, height, false);
        camera.left = -(heroCameraViewHeight * aspect) / 2;
        camera.right = (heroCameraViewHeight * aspect) / 2;
        camera.top = heroCameraViewHeight / 2;
        camera.bottom = -heroCameraViewHeight / 2;
        camera.updateProjectionMatrix();
        applySceneLayout(layout, rect);
        // Traversal-associated receiver plane disabled.
        // updateWhiplashHeaderShadowPlane(rect);
    }

    function screenToWorld(screenX, screenY, canvasRect, targetZ) {
        const ndc = new THREE.Vector3(
            ((screenX - canvasRect.left) / canvasRect.width) * 2 - 1,
            -(((screenY - canvasRect.top) / canvasRect.height) * 2 - 1),
            0
        );
        const worldPoint = ndc.unproject(camera);
        const direction = worldPoint.sub(camera.position).normalize();
        const distance = (targetZ - camera.position.z) / direction.z;
        return camera.position.clone().add(direction.multiplyScalar(distance));
    }

    // Traversal-associated receiver plane disabled.
    // function updateWhiplashHeaderShadowPlane(canvasRect) {
    //     const heading = document.querySelector('.hero-copy h1');
    //     if (!heading) {
    //         whiplashHeaderShadowPlane.visible = false;
    //         return;
    //     }
    //
    //     const headingRect = heading.getBoundingClientRect();
    //     const traversalWorldPosition = traversalRoot.getWorldPosition(new THREE.Vector3());
    //     const center = traversalWorldPosition.add(new THREE.Vector3(0, 1, -0.8));
    //     const planeDepth = center.z;
    //     const left = screenToWorld(headingRect.left, headingRect.top, canvasRect, planeDepth);
    //     const right = screenToWorld(headingRect.right, headingRect.top, canvasRect, planeDepth);
    //     const top = screenToWorld(headingRect.left, headingRect.top, canvasRect, planeDepth);
    //     const bottom = screenToWorld(headingRect.left, headingRect.bottom, canvasRect, planeDepth);
    //     const width = left.distanceTo(right);
    //     const height = top.distanceTo(bottom);
    //
    //     whiplashHeaderShadowPlane.visible = true;
    //     whiplashHeaderShadowPlane.position.copy(center);
    //     whiplashHeaderShadowPlane.rotation.set(0, 0, 0);
    //     whiplashHeaderShadowPlane.scale.set(width, height, 1);
    // }
    //
    // function screenToWorld(screenX, screenY, canvasRect, targetZ) {
    //     const ndc = new THREE.Vector3(
    //         ((screenX - canvasRect.left) / canvasRect.width) * 2 - 1,
    //         -(((screenY - canvasRect.top) / canvasRect.height) * 2 - 1),
    //         0
    //     );
    //     const worldPoint = ndc.unproject(camera);
    //     const direction = worldPoint.sub(camera.position).normalize();
    //     const distance = (targetZ - camera.position.z) / direction.z;
    //     return camera.position.clone().add(direction.multiplyScalar(distance));
    // }

    window.addEventListener('resize', resize, { passive: true });
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
    }
    if (document.fonts?.ready) {
        document.fonts.ready.then(resize);
    }
    resize();
    render();
}

function normalizeModel(model, targetHeight = 2.72) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const scale = targetHeight / Math.max(size.y, 0.001);
    model.scale.setScalar(scale);
    model.position.set(
        -center.x * scale,
        -center.y * scale + 0.08,
        -center.z * scale
    );

    model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
    });
    return { size, center, scale };
}

function createFallbackFigure(parent) {
    const material = new THREE.MeshStandardMaterial({
        color: 0xff8a35,
        roughness: 0.55,
        metalness: 0.05
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 2.2, 8, 18), material);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), material);
    head.position.y = 1.65;
    parent.add(body, head);
}
