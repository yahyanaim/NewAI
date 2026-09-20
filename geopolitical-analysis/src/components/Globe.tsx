import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import { geoPath, geoOrthographic } from 'd3-geo';
import type { ConflictIntensity } from '@/types';

interface GlobeProps {
  conflictData: ConflictIntensity[];
  onCountryClick: (countryCode: string) => void;
}

export function Globe({ conflictData, onCountryClick }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  const [isRotating, setIsRotating] = useState(true);
  const rotationRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const countryMapRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

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
      if (!globeMeshRef.current || !cameraRef.current || !containerRef.current) return;

      // Calculate mouse position in normalized device coordinates
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Perform raycasting
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(globeMeshRef.current);

      if (intersects.length > 0) {
        // For simplicity, trigger a sample country when clicking the globe
        // In a full implementation, you'd map UV coordinates to country codes
        const sampleCountries = ['USA', 'CHN', 'RUS', 'GBR', 'FRA', 'DEU', 'JPN', 'IND'];
        const randomCountry = sampleCountries[Math.floor(Math.random() * sampleCountries.length)];
        onCountryClick(randomCountry);
      }
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isRotating && !isDraggingRef.current) {
        rotationRef.current.y += 0.001;
      }

      // Apply rotation to globe mesh if it exists
      if (globeMeshRef.current) {
        globeMeshRef.current.rotation.x = rotationRef.current.x;
        globeMeshRef.current.rotation.y = rotationRef.current.y;
      }

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
  }, [isRotating, onCountryClick]);

  async function loadCountryData() {
    try {
      const response = await fetch('/data/countries-110m.json');
      const topology = await response.json();
      const countriesData = feature(topology, topology.objects.countries) as any;
      
      // Draw countries on canvas texture
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const context = canvas.getContext('2d');
      if (!context) return;

      const projection = geoOrthographic()
        .scale(512)
        .translate([1024, 512]);
      
      const path = geoPath(projection, context);

      context.fillStyle = '#0f0f0f';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw country borders
      context.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      context.lineWidth = 1;
      
      if (countriesData.features) {
        countriesData.features.forEach((country: any) => {
          context.beginPath();
          path(country);
          context.stroke();
          
          // Apply conflict intensity colors
          const countryCode = country.id;
          const conflictInfo = conflictData.find(c => c.country === countryCode);
          
          if (conflictInfo) {
            const colors = {
              low: 'rgba(16, 185, 129, 0.4)',
              medium: 'rgba(245, 158, 11, 0.5)',
              high: 'rgba(239, 68, 68, 0.6)',
              critical: 'rgba(220, 38, 38, 0.7)',
            };
            context.fillStyle = colors[conflictInfo.intensity];
            context.fill();
          }
        });
      }

      // Create or update globe mesh
      if (sceneRef.current) {
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 1,
        });
        
        const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
        const mesh = new THREE.Mesh(sphereGeometry, material);
        
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
    }
  }

  useEffect(() => {
    loadCountryData();
  }, [conflictData]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full perspective-1000"
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
    />
  );
}
