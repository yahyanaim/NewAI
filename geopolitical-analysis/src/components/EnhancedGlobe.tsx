import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import { geoPath, geoOrthographic } from 'd3-geo';
import type { ConflictIntensity, IntelEvent } from '@/types';

interface EnhancedGlobeProps {
  conflictData: ConflictIntensity[];
  intelEvents: IntelEvent[];
  selectedEventId?: string;
  onEventClick: (event: IntelEvent) => void;
}

// Create realistic earth atmosphere effects
function createEarthAtmosphere(scene: THREE.Scene) {
  // Outer atmosphere glow
  const atmosphereGeometry = new THREE.SphereGeometry(2.05, 64, 64);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      cameraPosition: { value: new THREE.Vector3() }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float time;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float time;
      
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
        vec3 atmosphere = vec3(0.3, 0.6, 1.0) * intensity;
        gl_FragColor = vec4(atmosphere, intensity * 0.3);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });
  
  const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphereMesh);

  // Inner glow effect
  const innerGlowGeometry = new THREE.SphereGeometry(1.95, 64, 64);
  const innerGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x112244,
    transparent: true,
    opacity: 0.1,
    side: THREE.FrontSide
  });
  
  const innerGlowMesh = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
  scene.add(innerGlowMesh);
}

export function EnhancedGlobe({ conflictData, intelEvents, selectedEventId, onEventClick }: EnhancedGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeMeshRef = useRef<THREE.Mesh | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  const [isRotating, setIsRotating] = useState(true);
  const rotationRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const eventMarkersRef = useRef<Map<string, THREE.Group>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup with enhanced atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.Fog(0x000011, 10, 50);
    sceneRef.current = scene;

    // Enhanced camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 4;
    cameraRef.current = camera;

    // High-quality renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Enhanced lighting system
    const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
    scene.add(ambientLight);

    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 3, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Rim lighting for better earth visibility
    const rimLight = new THREE.DirectionalLight(0x0088ff, 0.4);
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);

    // Create realistic earth atmosphere
    createEarthAtmosphere(scene);

    // Create marker group with shadows
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    markerGroupRef.current = markerGroup;

    // Load country data
    loadCountryData();

    // Mouse interaction handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
      setIsRotating(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;

      rotationRef.current.y += deltaX * 0.005;
      rotationRef.current.x -= deltaY * 0.005;
      rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x));

      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current) return;

      // Calculate mouse position in normalized device coordinates
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Check if clicked on event marker
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(
        Array.from(eventMarkersRef.current.values())
      );

      if (intersects.length > 0) {
        const clickedMarker = intersects[0].object;
        const eventId = Array.from(eventMarkersRef.current.entries())
          .find(([, mesh]) => mesh === clickedMarker)?.[0];
        
        if (eventId) {
          const event = intelEvents.find(e => e.id === eventId);
          if (event) {
            onEventClick(event);
          }
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Enhanced animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Smooth rotation when not dragging
      if (isRotating && !isDraggingRef.current) {
        rotationRef.current.y += 0.002; // Slightly faster rotation
      }

      // Apply rotation to globe mesh with damping
      if (globeMeshRef.current) {
        globeMeshRef.current.rotation.x = rotationRef.current.x;
        globeMeshRef.current.rotation.y = rotationRef.current.y;
      }

      // Apply rotation to marker group
      if (markerGroupRef.current) {
        markerGroupRef.current.rotation.x = rotationRef.current.x;
        markerGroupRef.current.rotation.y = rotationRef.current.y;
      }

      // Enhanced marker animations
      animateMarkers();

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRotating, onEventClick]);

  async function loadCountryData() {
    try {
      const response = await fetch('/data/countries-110m.json');
      const topology = await response.json();
      const countriesData = feature(topology, topology.objects.countries) as any;
      
      // Create realistic earth canvas texture
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const context = canvas.getContext('2d');
      if (!context) return;

      const projection = geoOrthographic()
        .scale(512)
        .translate([1024, 512]);
      
      const path = geoPath(projection, context);

      // Create realistic earth background
      const gradient = context.createRadialGradient(512, 512, 100, 512, 512, 600);
      gradient.addColorStop(0, '#1a237e');
      gradient.addColorStop(0.3, '#0d47a1');
      gradient.addColorStop(0.6, '#1565c0');
      gradient.addColorStop(0.8, '#1976d2');
      gradient.addColorStop(1, '#42a5f5');
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Add ocean texture effect
      context.fillStyle = 'rgba(33, 150, 243, 0.3)';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 20 + 5;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }

      // Enhanced country borders with better visibility
      context.strokeStyle = 'rgba(200, 200, 200, 0.6)';
      context.lineWidth = 1.5;
      context.shadowColor = 'rgba(0, 0, 0, 0.3)';
      context.shadowBlur = 2;
      
      // Draw countries with realistic colors
      if (countriesData.features) {
        countriesData.features.forEach((country: any) => {
          context.beginPath();
          path(country);
          
          const countryCode = country.id;
          const conflictInfo = conflictData.find(c => c.country === countryCode);
          
          if (conflictInfo) {
            // Enhanced conflict intensity colors
            const colors = {
              low: 'rgba(76, 175, 80, 0.4)',      // Green
              medium: 'rgba(255, 193, 7, 0.5)',    // Amber  
              high: 'rgba(244, 67, 54, 0.6)',      // Red
              critical: 'rgba(183, 28, 28, 0.7)',  // Dark Red
            };
            context.fillStyle = colors[conflictInfo.intensity];
            context.fill();
            context.strokeStyle = colors[conflictInfo.intensity];
            context.stroke();
          } else {
            // Peaceful countries - earth tones
            context.fillStyle = 'rgba(139, 69, 19, 0.3)'; // Brown
            context.fill();
            context.stroke();
          }
        });
      }

      // Add major cities glow effect
      const cities = [
        { lat: 34.0209, lng: -6.8416, name: 'Rabat' },    // Morocco
        { lat: 33.5731, lng: -7.5898, name: 'Casablanca' },
        { lat: 31.6295, lng: -7.9811, name: 'Marrakech' },
        { lat: 35.7595, lng: -5.8340, name: 'Tangier' },
        { lat: 40.7128, lng: -74.0060, name: 'New York' },
        { lat: 51.5074, lng: -0.1278, name: 'London' },
        { lat: 48.8566, lng: 2.3522, name: 'Paris' }
      ];

      cities.forEach(city => {
        const phi = (90 - city.lat) * (Math.PI / 180);
        const theta = (city.lng + 180) * (Math.PI / 180);
        const x = 512 - 512 * Math.sin(phi) * Math.cos(theta);
        const y = 512 - 512 * Math.cos(phi);
        
        // City glow effect
        const cityGradient = context.createRadialGradient(x, y, 0, x, y, 15);
        cityGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        cityGradient.addColorStop(0.3, 'rgba(255, 255, 0, 0.6)');
        cityGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        context.fillStyle = cityGradient;
        context.beginPath();
        context.arc(x, y, 15, 0, Math.PI * 2);
        context.fill();
      });

      // Create enhanced globe mesh with better materials
      if (sceneRef.current) {
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const material = new THREE.MeshPhongMaterial({
          map: texture,
          transparent: true,
          opacity: 0.95,
          shininess: 10,
          specular: new THREE.Color(0x333333)
        });
        
        const sphereGeometry = new THREE.SphereGeometry(1, 128, 128);
        const mesh = new THREE.Mesh(sphereGeometry, material);
        
        // Add subtle bump mapping for earth texture
        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = 1024;
        bumpCanvas.height = 512;
        const bumpContext = bumpCanvas.getContext('2d');
        if (bumpContext) {
          const bumpGradient = bumpContext.createRadialGradient(512, 256, 100, 512, 256, 400);
          bumpGradient.addColorStop(0, '#888');
          bumpGradient.addColorStop(1, '#444');
          bumpContext.fillStyle = bumpGradient;
          bumpContext.fillRect(0, 0, 1024, 512);
          
          const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
          material.bumpMap = bumpTexture;
          material.bumpScale = 0.02;
        }
        
        // Preserve rotation if mesh already exists
        if (globeMeshRef.current) {
          mesh.rotation.copy(globeMeshRef.current.rotation);
          sceneRef.current.remove(globeMeshRef.current);
        }
        
        globeMeshRef.current = mesh;
        sceneRef.current.add(mesh);
      }
    } catch (error) {
      console.error('Error loading country data:', error);
      
      // Fallback: Create simple sphere if data fails
      if (sceneRef.current && !globeMeshRef.current) {
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = new THREE.MeshPhongMaterial({
          color: 0x1565c0,
          transparent: true,
          opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        globeMeshRef.current = mesh;
        sceneRef.current.add(mesh);
      }
    }
  }

  // Update event markers when events change
  useEffect(() => {
    if (!markerGroupRef.current) return;

    // Clear existing markers
    eventMarkersRef.current.forEach(marker => {
      markerGroupRef.current?.remove(marker);
    });
    eventMarkersRef.current.clear();

    // Create new markers for each event
    intelEvents.forEach(event => {
      const marker = createEventMarker(event);
      markerGroupRef.current?.add(marker);
      eventMarkersRef.current.set(event.id, marker);
    });
  }, [intelEvents]);

  function createEventMarker(event: IntelEvent): THREE.Group {
    // Convert lat/lng to 3D position on sphere
    const phi = (90 - event.location.lat) * (Math.PI / 180);
    const theta = (event.location.lng + 180) * (Math.PI / 180);
    const radius = 1.05; // Raised above globe surface

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    // Enhanced color system based on event priority and sentiment
    const getMarkerColor = () => {
      const priorityColors = {
        low: { positive: 0x4CAF50, negative: 0xF44336, neutral: 0xFF9800 },
        normal: { positive: 0x8BC34A, negative: 0xFF5722, neutral: 0xFFC107 },
        high: { positive: 0xCDDC39, negative: 0xE91E63, neutral: 0xFF8F00 },
        critical: { positive: 0xCDDC39, negative: 0x9C27B0, neutral: 0xFF6F00 }
      };
      
      return priorityColors[event.priority][event.sentiment] || 0xFFFFFF;
    };

    // Create realistic 3D marker with depth
    const markerGroup = new THREE.Group();
    
    // Main marker sphere
    const coreGeometry = new THREE.SphereGeometry(0.025, 20, 20);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: getMarkerColor(),
      emissive: getMarkerColor(),
      emissiveIntensity: 0.3,
      shininess: 100,
      transparent: true,
      opacity: 0.95,
    });
    
    const coreMarker = new THREE.Mesh(coreGeometry, coreMaterial);
    markerGroup.add(coreMarker);

    // Enhanced glow effect with multiple layers
    const glowGeometry = new THREE.SphereGeometry(0.04, 20, 20);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: getMarkerColor(),
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    
    const glowMarker = new THREE.Mesh(glowGeometry, glowMaterial);
    markerGroup.add(glowMarker);

    // Outer pulse ring
    const pulseGeometry = new THREE.RingGeometry(0.05, 0.08, 16);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: getMarkerColor(),
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    
    const pulseRing = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulseRing.position.set(0, 0, 0);
    markerGroup.add(pulseRing);

    // Position the marker group
    markerGroup.position.set(x, y, z);

    // Add floating animation
    markerGroup.userData = { pulseRing, event, originalPosition: new THREE.Vector3(x, y, z) };

    return markerGroup;
  }

  // Enhanced animation system
  function animateMarkers() {
    const time = Date.now() * 0.002;
    
    eventMarkersRef.current.forEach((markerGroup) => {
      if (markerGroup.userData.pulseRing) {
        const pulseRing = markerGroup.userData.pulseRing;
        pulseRing.rotation.z = time;
        pulseRing.scale.setScalar(1 + Math.sin(time + markerGroup.position.x) * 0.1);
        
        // Subtle floating motion
        const originalPos = markerGroup.userData.originalPosition;
        markerGroup.position.y = originalPos.y + Math.sin(time + originalPos.x) * 0.01;
      }
    });
  }

  useEffect(() => {
    loadCountryData();
  }, [conflictData]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
    />
  );
}
