
import { Color, useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { useRef } from "react";
type lineProps = {
    start: Vector3,
    end: Vector3,
    color?: Color
}

const Line = ({start, end, color="white"}: lineProps) => {
    const ref = useRef<any>()

    //call setFromPoints function on buffer geometry
    useFrame(() => {
        if (ref.current) {
            ref.current.geometry.setFromPoints([start, end]);
        }
    })
    return (
        <line  ref={ref}>
            <bufferGeometry />
            <lineBasicMaterial color={color} />
        </line>
    )
}

export default Line;




