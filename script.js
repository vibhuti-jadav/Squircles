const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let squircles = [];
let animationId;
let lastTime = 0;
let fps = 60;
let frameCount = 0;
let lastFpsTime = 0;

// Configuration
const config = {
	count: 15,
	size: 40,
	curve: 1.2,
	speed: 1,
	color1: '#6366f1',
	color2: '#ec4899',
	opacity: 0.8,
	autoSpeed: 2.0,
	baseCurve: 1.2
};

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

class Squircle {
	constructor() {
		this.reset();
		this.age = Math.random() * 1000;
	}

	reset() {
		this.x = Math.random() * canvas.width;
		this.y = Math.random() * canvas.height;
		this.z = Math.random() * 200 - 100;
		this.vx = (Math.random() - 0.5) * 2;
		this.vy = (Math.random() - 0.5) * 2;
		this.vz = (Math.random() - 0.5) * 1;
		this.rotation = Math.random() * Math.PI * 2;
		this.rotationSpeed = (Math.random() - 0.5) * 0.02;
		this.scale = 0.5 + Math.random() * 1.5;
		this.pulsePhase = Math.random() * Math.PI * 2;
	}

	update(deltaTime) {
		const speed = config.speed;
		this.age += deltaTime * 0.001;

		// Floating motion with sine waves
		this.x += this.vx * speed + Math.sin(this.age * 0.5) * 0.5;
		this.y += this.vy * speed + Math.cos(this.age * 0.3) * 0.3;
		this.z += this.vz * speed + Math.sin(this.age * 0.7) * 0.2;

		// Boundary wrapping with smooth transitions
		if (this.x < -50) this.x = canvas.width + 50;
		if (this.x > canvas.width + 50) this.x = -50;
		if (this.y < -50) this.y = canvas.height + 50;
		if (this.y > canvas.height + 50) this.y = -50;
		if (this.z < -100) this.z = 100;
		if (this.z > 100) this.z = -100;

		this.rotation += this.rotationSpeed * speed;
	}

	draw() {
		const depth = (this.z + 100) / 200;
		const perspectiveScale = 0.5 + depth * 0.5;
		const size = config.size * this.scale * perspectiveScale;
		const pulse = 1 + Math.sin(this.age * 2 + this.pulsePhase) * 0.1;

		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.rotation);
		ctx.scale(pulse, pulse);

		// Create gradient
		const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
		const color1 = hexToRgb(config.color1);
		const color2 = hexToRgb(config.color2);

		gradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${config.opacity * depth})`);
		gradient.addColorStop(0.7, `rgba(${color2.r}, ${color2.g}, ${color2.b}, ${config.opacity * depth * 0.8})`);
		gradient.addColorStop(1, `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0)`);

		// Create squircle path
		ctx.beginPath();
		this.drawSquirclePath(size);

		// Fill with gradient
		ctx.fillStyle = gradient;
		ctx.fill();

		// Add subtle glow
		ctx.shadowColor = config.color1;
		ctx.shadowBlur = 20 * depth;
		ctx.fill();

		ctx.restore();
	}

	drawSquirclePath(size) {
		const n = config.curve;
		const segments = 64;

		for (let i = 0; i <= segments; i++) {
			const angle = (i / segments) * 2 * Math.PI;
			const cos = Math.cos(angle);
			const sin = Math.sin(angle);

			const x = size * Math.sign(cos) * Math.pow(Math.abs(cos), 2/n);
			const y = size * Math.sign(sin) * Math.pow(Math.abs(sin), 2/n);

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.closePath();
	}
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : {r: 99, g: 102, b: 241};
}

function createSquircles() {
	squircles = [];
	for (let i = 0; i < config.count; i++) {
		squircles.push(new Squircle());
	}
}

function animate(currentTime) {
	const deltaTime = currentTime - lastTime;
	lastTime = currentTime;

	// Auto-animate squircle factor if enabled
	if (config.autoSpeed > 0) {
		const t = currentTime * 0.001 * config.autoSpeed;
		config.curve = 0.9 * Math.sin(t) + 1.1;

		// Update the slider and display (but don't trigger the event)
		const curveSlider = document.getElementById('curve');
		const curveValue = document.getElementById('curveValue');
		if (curveSlider && curveValue) {
			curveSlider.value = config.curve.toFixed(1);
			curveValue.textContent = config.curve.toFixed(1);
		}
	}

	// Calculate FPS
	frameCount++;
	if (currentTime - lastFpsTime >= 1000) {
		fps = Math.round(frameCount * 1000 / (currentTime - lastFpsTime));
		document.getElementById('fps').textContent = fps;
		frameCount = 0;
		lastFpsTime = currentTime;
	}

	// Clear canvas with fade effect
	ctx.fillStyle = 'rgba(12, 12, 12, 0.1)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Update and draw squircles
	squircles.forEach(squircle => {
		squircle.update(deltaTime);
		squircle.draw();
	});

	// Update stats
	document.getElementById('activeCount').textContent = squircles.length;

	animationId = requestAnimationFrame(animate);
}

function setupControls() {
	const controls = ['count', 'size', 'curve', 'speed', 'opacity', 'autoSpeed'];

	controls.forEach(control => {
		const slider = document.getElementById(control);
		if (!slider) return;

		const valueDisplay = document.getElementById(control + 'Value');

		slider.addEventListener('input', (e) => {
			const value = parseFloat(e.target.value);
			config[control] = value;

			if (control === 'curve') {
				// Store the base curve value when manually adjusted
				if (config.autoSpeed === 0) {
					config.baseCurve = value;
				}
				valueDisplay.textContent = value.toFixed(1);
			} else {
				valueDisplay.textContent = control === 'speed' || control === 'opacity' || control === 'autoSpeed'
					? value.toFixed(1) : Math.round(value);
			}

			if (control === 'count') {
				createSquircles();
			}
		});
	});

	const colorInputs = ['color1', 'color2'];
	colorInputs.forEach(colorId => {
		const colorInput = document.getElementById(colorId);
		colorInput.addEventListener('input', (e) => {
			config[colorId] = e.target.value;
		});
	});
}

function randomizeAll() {
	config.count = Math.floor(Math.random() * 40) + 10;
	config.size = Math.floor(Math.random() * 80) + 20;
	config.curve = Math.random() * 1.8 + 0.2;
	config.baseCurve = config.curve;
	config.speed = Math.random() * 2.5 + 0.5;
	config.opacity = Math.random() * 0.7 + 0.3;
	config.autoSpeed = Math.random() * 3;

	// Random colors
	randomizeColors();

	// Update all sliders
	document.getElementById('count').value = config.count;
	document.getElementById('size').value = config.size;
	document.getElementById('curve').value = config.curve.toFixed(1);
	document.getElementById('speed').value = config.speed.toFixed(1);
	document.getElementById('opacity').value = config.opacity.toFixed(1);
	document.getElementById('autoSpeed').value = config.autoSpeed.toFixed(1);

	// Update displays
	document.getElementById('countValue').textContent = config.count;
	document.getElementById('sizeValue').textContent = config.size;
	document.getElementById('curveValue').textContent = config.curve.toFixed(1);
	document.getElementById('speedValue').textContent = config.speed.toFixed(1);
	document.getElementById('opacityValue').textContent = config.opacity.toFixed(1);
	document.getElementById('autoSpeedValue').textContent = config.autoSpeed.toFixed(1);

	createSquircles();
}

function randomizeColors() {
	// Generate random vibrant colors
	const hue1 = Math.floor(Math.random() * 360);
	const hue2 = Math.floor(Math.random() * 360);

	config.color1 = `hsl(${hue1}, ${70 + Math.random() * 30}%, ${40 + Math.random() * 30}%)`;
	config.color2 = `hsl(${hue2}, ${70 + Math.random() * 30}%, ${40 + Math.random() * 30}%)`;

	// Convert HSL to hex for the color inputs
	const tempDiv = document.createElement('div');
	tempDiv.style.color = config.color1;
	document.body.appendChild(tempDiv);
	const color1Computed = getComputedStyle(tempDiv).color;
	tempDiv.style.color = config.color2;
	const color2Computed = getComputedStyle(tempDiv).color;
	document.body.removeChild(tempDiv);

	// Extract RGB values and convert to hex
	const rgb1Match = color1Computed.match(/\d+/g);
	const rgb2Match = color2Computed.match(/\d+/g);

	if (rgb1Match && rgb2Match) {
		config.color1 = `#${parseInt(rgb1Match[0]).toString(16).padStart(2, '0')}${parseInt(rgb1Match[1]).toString(16).padStart(2, '0')}${parseInt(rgb1Match[2]).toString(16).padStart(2, '0')}`;
		config.color2 = `#${parseInt(rgb2Match[0]).toString(16).padStart(2, '0')}${parseInt(rgb2Match[1]).toString(16).padStart(2, '0')}${parseInt(rgb2Match[2]).toString(16).padStart(2, '0')}`;
	}

	document.getElementById('color1').value = config.color1;
	document.getElementById('color2').value = config.color2;
}

function resetToDefaults() {
	config.count = 15;
	config.size = 40;
	config.curve = 1.2;
	config.baseCurve = 1.2;
	config.speed = 1;
	config.color1 = '#6366f1';
	config.color2 = '#ec4899';
	config.opacity = 0.8;
	config.autoSpeed = 2.0;

	document.getElementById('count').value = config.count;
	document.getElementById('size').value = config.size;
	document.getElementById('curve').value = config.curve;
	document.getElementById('speed').value = config.speed;
	document.getElementById('color1').value = config.color1;
	document.getElementById('color2').value = config.color2;
	document.getElementById('opacity').value = config.opacity;
	document.getElementById('autoSpeed').value = config.autoSpeed;

	document.getElementById('countValue').textContent = config.count;
	document.getElementById('sizeValue').textContent = config.size;
	document.getElementById('curveValue').textContent = config.curve.toFixed(1);
	document.getElementById('speedValue').textContent = config.speed.toFixed(1);
	document.getElementById('opacityValue').textContent = config.opacity.toFixed(1);
	document.getElementById('autoSpeedValue').textContent = config.autoSpeed.toFixed(1);

	createSquircles();
}

// Initialize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
setupControls();
createSquircles();
animate(0);