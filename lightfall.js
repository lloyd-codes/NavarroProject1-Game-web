// Adapted for this application from React Bits Lightfall.
// See THIRD_PARTY_NOTICES.md for source and license details.
(function () {
  "use strict";

  const containers = document.querySelectorAll("[data-lightfall]");

  if (!containers.length) {
    return;
  }

  containers.forEach(initializeLightfall);

  function initializeLightfall(container) {
  const surface = container.closest("[data-lightfall-surface]");

  if (!surface) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "lightfall-canvas";
  canvas.setAttribute("aria-hidden", "true");
  container.append(canvas);

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false
  });

  if (!gl) {
    container.hidden = true;
    return;
  }

  const highPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  const fragmentPrecision = highPrecision && highPrecision.precision > 0 ? "highp" : "mediump";

  const vertexShaderSource = `
    attribute vec2 aPosition;

    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision ${fragmentPrecision} float;

    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform float uTime;
    uniform vec3 uColor0;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uBackgroundColor;
    uniform vec3 uMouseColor;
    uniform float uSpeed;
    uniform float uStreakWidth;
    uniform float uStreakLength;
    uniform float uGlow;
    uniform float uDensity;
    uniform float uTwinkle;
    uniform float uZoom;
    uniform float uBackgroundGlow;
    uniform float uMouseStrength;
    uniform float uMouseRadius;

    vec3 palette(float amount) {
      float section = clamp(amount, 0.0, 0.999999) * 3.0;

      if (section < 1.0) {
        return uColor0;
      }

      if (section < 2.0) {
        return uColor1;
      }

      return uColor2;
    }

    vec3 tanhVector(vec3 value) {
      vec3 exponential = exp(-2.0 * value);
      return (1.0 - exponential) / (1.0 + exponential);
    }

    vec2 tunnelScene(vec2 fragment, vec2 resolution) {
      vec2 point = (fragment + fragment - resolution) / resolution.x;
      float depth = 0.0;
      float distanceToSurface = 1000.0;
      vec4 origin = vec4(0.0);

      for (int step = 0; step < 32; step++) {
        if (distanceToSurface <= 0.0001) {
          break;
        }

        origin = depth * normalize(vec4(point, uZoom, 0.0))
          - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
        distanceToSurface = 1.0 - sqrt(length(origin * origin));
        depth += distanceToSurface;
      }

      return vec2(origin.x, atan(origin.z, origin.y));
    }

    void mainImage(out vec4 outputColor, vec2 fragmentCoordinate) {
      vec2 resolution = uResolution;
      vec2 normalizedUv = (fragmentCoordinate + fragmentCoordinate - resolution) / resolution.x;
      float time = 0.1 * uTime * uSpeed + 9.0;
      float angularRings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5));
      vec2 cellSize = vec2(0.005, 6.28318530718 / angularRings);
      vec2 scene = tunnelScene(fragmentCoordinate, resolution);
      vec2 sceneDx = tunnelScene(fragmentCoordinate + vec2(1.0, 0.0), resolution);
      vec2 sceneDy = tunnelScene(fragmentCoordinate + vec2(0.0, 1.0), resolution);
      vec2 derivativeX = sceneDx - scene;
      vec2 derivativeY = sceneDy - scene;

      derivativeX.y -= 6.28318530718 * floor(derivativeX.y / 6.28318530718 + 0.5);
      derivativeY.y -= 6.28318530718 * floor(derivativeY.y / 6.28318530718 + 0.5);

      vec2 filterWidth = abs(derivativeX) + abs(derivativeY);
      vec2 glowPoint = vec2(2.0, 1.0) * normalizedUv
        - (resolution / resolution.x) * vec2(0.0, 1.0);
      vec4 accumulated = vec4(
        uBackgroundColor * 90.0 * uBackgroundGlow
          / (1000.0 * dot(glowPoint, glowPoint) + 6.0),
        0.0
      );

      vec2 normalizedMouse = (uMouse + uMouse - resolution) / resolution.x;
      float mouseDistance = length(normalizedUv - normalizedMouse);
      float mouseGlow = exp(
        -mouseDistance * mouseDistance / max(uMouseRadius * uMouseRadius, 0.0001)
      ) * uMouseStrength;
      accumulated.rgb += uMouseColor * mouseGlow * 0.25;

      float streakRadius = 0.0005 * uStreakWidth;
      vec2 smoothing = vec2(max(length(filterWidth), 0.00001));
      float tail = 19.0 / max(uStreakLength, 0.05);

      for (int streak = 0; streak < 3; streak++) {
        float index = float(streak) + 1.0;
        float randomCell = fract(
          sin(dot(vec2(index, floor(scene.x / cellSize.x + 0.5)), vec2(7.0, 11.0))) * 73.0
        );
        vec2 streakPoint = scene - (time + time * randomCell) * vec2(0.0, 1.0);
        streakPoint -= floor(streakPoint / cellSize + 0.5) * cellSize;

        float hue = fract(8663.0 * randomCell);
        vec3 streakColor = palette(hue);
        float weight = mix(1.5, 1.0 + sin(time + 7.0 * hue + 4.0), uTwinkle);
        weight *= 1.0 + mouseGlow * 2.0;

        vec2 inner = vec2(
          length(max(streakPoint, vec2(-1.0, 0.0))),
          length(streakPoint) - streakRadius
        ) - streakRadius;
        vec2 softened = vec2(1.0) - smoothstep(-smoothing, smoothing, inner);
        accumulated.rgb += dot(softened, vec2(exp(tail * streakPoint.y), 3.0))
          * streakColor
          * weight;
        scene.x += cellSize.x / 8.0;
      }

      vec3 finalColor = sqrt(tanhVector(max(
        accumulated.rgb * uGlow - vec3(0.04, 0.08, 0.02),
        0.0
      )));
      outputColor = vec4(finalColor, 1.0);
    }

    void main() {
      vec4 color;
      mainImage(color, gl_FragCoord.xy);
      gl_FragColor = color;
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);

    if (!shader) {
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("Lightfall shader could not be compiled.", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  function createProgram() {
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      if (vertexShader) {
        gl.deleteShader(vertexShader);
      }
      if (fragmentShader) {
        gl.deleteShader(fragmentShader);
      }
      return null;
    }

    const shaderProgram = gl.createProgram();

    if (!shaderProgram) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.warn("Lightfall shader program could not be linked.", gl.getProgramInfoLog(shaderProgram));
      gl.deleteProgram(shaderProgram);
      return null;
    }

    return shaderProgram;
  }

  const program = createProgram();

  if (!program) {
    container.hidden = true;
    return;
  }

  const positionBuffer = gl.createBuffer();

  if (!positionBuffer) {
    container.hidden = true;
    gl.deleteProgram(program);
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
      3, -1,
      -1, 3
    ]),
    gl.STATIC_DRAW
  );

  const locations = {
    position: gl.getAttribLocation(program, "aPosition"),
    resolution: gl.getUniformLocation(program, "uResolution"),
    mouse: gl.getUniformLocation(program, "uMouse"),
    time: gl.getUniformLocation(program, "uTime"),
    color0: gl.getUniformLocation(program, "uColor0"),
    color1: gl.getUniformLocation(program, "uColor1"),
    color2: gl.getUniformLocation(program, "uColor2"),
    backgroundColor: gl.getUniformLocation(program, "uBackgroundColor"),
    mouseColor: gl.getUniformLocation(program, "uMouseColor"),
    speed: gl.getUniformLocation(program, "uSpeed"),
    streakWidth: gl.getUniformLocation(program, "uStreakWidth"),
    streakLength: gl.getUniformLocation(program, "uStreakLength"),
    glow: gl.getUniformLocation(program, "uGlow"),
    density: gl.getUniformLocation(program, "uDensity"),
    twinkle: gl.getUniformLocation(program, "uTwinkle"),
    zoom: gl.getUniformLocation(program, "uZoom"),
    backgroundGlow: gl.getUniformLocation(program, "uBackgroundGlow"),
    mouseStrength: gl.getUniformLocation(program, "uMouseStrength"),
    mouseRadius: gl.getUniformLocation(program, "uMouseRadius")
  };

  gl.useProgram(program);
  gl.enableVertexAttribArray(locations.position);
  gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
  gl.uniform3f(locations.color0, 0.42, 0.86, 0.91);
  gl.uniform3f(locations.color1, 0.84, 0.0, 0.0);
  gl.uniform3f(locations.color2, 1.0, 0.42, 0.42);
  gl.uniform3f(locations.backgroundColor, 0.025, 0.09, 0.15);
  gl.uniform3f(locations.mouseColor, 0.753, 0.427, 0.443);
  gl.uniform1f(locations.speed, 0.42);
  gl.uniform1f(locations.streakWidth, 1.2);
  gl.uniform1f(locations.streakLength, 1.15);
  gl.uniform1f(locations.glow, 1.0);
  gl.uniform1f(locations.density, 0.62);
  gl.uniform1f(locations.twinkle, 0.75);
  gl.uniform1f(locations.zoom, 3.0);
  gl.uniform1f(locations.backgroundGlow, 0.55);
  gl.uniform1f(locations.mouseStrength, 0.36);
  gl.uniform1f(locations.mouseRadius, 0.78);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const forcedColors = window.matchMedia("(forced-colors: active)");
  const frameInterval = 1000 / 30;
  const maxPixelCount = 720000;
  const targetMouse = { x: 0, y: 0 };
  const currentMouse = { x: 0, y: 0 };
  let pixelRatio = 1;
  let elapsedTime = 0;
  let animationFrame = 0;
  let previousFrameTime = 0;
  let isVisible = true;
  let hasRendered = false;
  let contextAvailable = true;
  let containerBounds = { left: 0, top: 0, width: 1, height: 1 };

  function draw(time) {
    if (forcedColors.matches || !contextAvailable) {
      return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.uniform2f(locations.resolution, canvas.width, canvas.height);
    gl.uniform2f(locations.mouse, currentMouse.x, currentMouse.y);
    gl.uniform1f(locations.time, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!hasRendered) {
      hasRendered = true;
      surface.classList.add("has-lightfall");
    }
  }

  function resize() {
    const bounds = container.getBoundingClientRect();
    containerBounds = {
      left: bounds.left + window.scrollX,
      top: bounds.top + window.scrollY,
      width: bounds.width,
      height: bounds.height
    };
    const cssPixelCount = Math.max(1, bounds.width * bounds.height);
    const budgetPixelRatio = Math.sqrt(maxPixelCount / cssPixelCount);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.15, budgetPixelRatio);

    const width = Math.max(1, Math.round(bounds.width * pixelRatio));
    const height = Math.max(1, Math.round(bounds.height * pixelRatio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      targetMouse.x = width * 0.5;
      targetMouse.y = height * 0.5;
      currentMouse.x = targetMouse.x;
      currentMouse.y = targetMouse.y;
    }

    draw(reducedMotion.matches ? 0 : elapsedTime);
  }

  function shouldAnimate() {
    return !reducedMotion.matches
      && !forcedColors.matches
      && contextAvailable
      && isVisible
      && !document.hidden;
  }

  function renderFrame(timestamp) {
    animationFrame = 0;

    if (!shouldAnimate()) {
      return;
    }

    if (timestamp - previousFrameTime < frameInterval) {
      animationFrame = window.requestAnimationFrame(renderFrame);
      return;
    }

    const deltaSeconds = previousFrameTime
      ? Math.min(0.1, (timestamp - previousFrameTime) * 0.001)
      : frameInterval * 0.001;
    previousFrameTime = timestamp;
    elapsedTime = timestamp * 0.001;
    const mouseFactor = 1 - Math.exp(-deltaSeconds / 0.16);
    currentMouse.x += (targetMouse.x - currentMouse.x) * mouseFactor;
    currentMouse.y += (targetMouse.y - currentMouse.y) * mouseFactor;
    draw(elapsedTime);
    animationFrame = window.requestAnimationFrame(renderFrame);
  }

  function startAnimation() {
    if (!animationFrame && shouldAnimate()) {
      animationFrame = window.requestAnimationFrame(renderFrame);
    }
  }

  function stopAnimation() {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  }

  function syncAnimation() {
    if (shouldAnimate()) {
      startAnimation();
      return;
    }

    stopAnimation();

    if (reducedMotion.matches) {
      draw(0);
    }
  }

  function handlePointerMove(event) {
    if (reducedMotion.matches) {
      return;
    }

    const bounds = containerBounds;

    if (!bounds.width || !bounds.height) {
      return;
    }

    const pointerX = event.clientX + window.scrollX - bounds.left;
    const pointerY = event.clientY + window.scrollY - bounds.top;
    targetMouse.x = pointerX * pixelRatio;
    targetMouse.y = (bounds.height - pointerY) * pixelRatio;
  }

  function handlePointerLeave() {
    targetMouse.x = canvas.width * 0.5;
    targetMouse.y = canvas.height * 0.5;
  }

  function handleDisplayPreferenceChange() {
    resize();
    syncAnimation();
  }

  surface.addEventListener("pointermove", handlePointerMove, { passive: true });
  surface.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  document.addEventListener("visibilitychange", syncAnimation);

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleDisplayPreferenceChange);
  } else {
    reducedMotion.addListener(handleDisplayPreferenceChange);
  }

  if (typeof forcedColors.addEventListener === "function") {
    forcedColors.addEventListener("change", handleDisplayPreferenceChange);
  } else {
    forcedColors.addListener(handleDisplayPreferenceChange);
  }

  if (typeof ResizeObserver === "function") {
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
  } else {
    window.addEventListener("resize", resize, { passive: true });
  }

  if (typeof IntersectionObserver === "function") {
    const visibilityObserver = new IntersectionObserver((entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
      syncAnimation();
    });
    visibilityObserver.observe(surface);
  }

  canvas.addEventListener("webglcontextlost", () => {
    contextAvailable = false;
    stopAnimation();
    surface.classList.remove("has-lightfall");
  }, { once: true });

  resize();
  syncAnimation();
  }
}());
