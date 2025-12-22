import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SnowSystem: React.FC = () => {
    const count = 2000; 
    const pointsRef = useRef<THREE.Points>(null);

    // 预计算位置和速度
    const { positions, velocities, phases } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const vel = new Float32Array(count);
        const phs = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // 随机分布
            pos[i * 3] = (Math.random() - 0.5) * 60; // x
            pos[i * 3 + 1] = Math.random() * 40;     // y (高度 0-40)
            pos[i * 3 + 2] = (Math.random() - 0.5) * 60; // z

            // 速度调慢：0.02 ~ 0.05
            vel[i] = 0.02 + Math.random() * 0.03; 
            phs[i] = Math.random() * Math.PI * 2; // 摇摆相位
        }
        return { positions: pos, velocities: vel, phases: phs };
    }, [count]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        
        const positionsAttribute = pointsRef.current.geometry.attributes.position;
        const currentPositions = positionsAttribute.array as Float32Array;
        const time = state.clock.getElapsedTime();

        for (let i = 0; i < count; i++) {
            let y = currentPositions[i * 3 + 1];
            
            // 下落逻辑
            y -= velocities[i];

            // 循环重置到顶部
            if (y < -10) {
                y = 40;
                currentPositions[i * 3] = (Math.random() - 0.5) * 60;
                currentPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
            }

            currentPositions[i * 3 + 1] = y;

            // 缓慢的水平摇摆
            const windX = Math.sin(time * 0.3 + phases[i]) * 0.01;
            const windZ = Math.cos(time * 0.2 + phases[i]) * 0.01;
            
            currentPositions[i * 3] += windX;
            currentPositions[i * 3 + 2] += windZ;
        }

        positionsAttribute.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#ffffff"
                size={0.15} 
                transparent
                opacity={0.8}
                sizeAttenuation={true}
                depthWrite={false}
            />
        </points>
    );
};

export default SnowSystem;
