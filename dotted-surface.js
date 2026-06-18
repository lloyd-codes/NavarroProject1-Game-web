// Three.js Animated Dotted Surface Background
class DottedSurface {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!containerSelector) return;

    this.SEPARATION = 150;
    this.AMOUNTX = 40;
    this.AMOUNTY = 60;
    this.count = 0;

    this.init();
    this.animate();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    this.camera.position.set(0, 355, 1220);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(this.scene.fog.color, 0);

    this.container.appendChild(this.renderer.domElement);

    // Create particles
    const positions = [];
    const colors = [];

    // Determine color based on theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      document.body.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const r = isDark ? 200 : 0;
    const g = isDark ? 200 : 0;
    const b = isDark ? 200 : 0;

    for (let ix = 0; ix < this.AMOUNTX; ix++) {
      for (let iy = 0; iy < this.AMOUNTY; iy++) {
        const x = ix * this.SEPARATION - (this.AMOUNTX * this.SEPARATION) / 2;
        const y = 0;
        const z = iy * this.SEPARATION - (this.AMOUNTY * this.SEPARATION) / 2;

        positions.push(x, y, z);
        colors.push(r / 255, g / 255, b / 255);
      }
    }

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    );
    this.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(colors), 3)
    );

    // Create material
    this.material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    // Create points
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    const positionAttribute = this.geometry.attributes.position;
    const positions = positionAttribute.array;

    let i = 0;
    for (let ix = 0; ix < this.AMOUNTX; ix++) {
      for (let iy = 0; iy < this.AMOUNTY; iy++) {
        const index = i * 3;

        // Animate Y position with sine waves
        positions[index + 1] =
          Math.sin((ix + this.count) * 0.3) * 50 +
          Math.sin((iy + this.count) * 0.5) * 50;

        i++;
      }
    }

    positionAttribute.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
    this.count += 0.1;
  };

  handleResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  dispose() {
    cancelAnimationFrame(this.animationId);
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DottedSurface('#dotted-surface-container');
  });
} else {
  new DottedSurface('#dotted-surface-container');
}
