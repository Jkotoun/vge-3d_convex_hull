import * as THREE from 'three';


class Point3D
{
    public x: number;
    public y: number;
    public z: number;
    public processed: boolean;

    constructor(x: number, y: number, z: number, processed: boolean = false)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.processed = processed;
    }

    public toVector3(): THREE.Vector3
    {
        return new THREE.Vector3(this.x, this.y, this.z);
    }

    public static fromVector3(vector: THREE.Vector3): Point3D
    {
        return new Point3D(vector.x, vector.y, vector.z);
    }
}

class Face
{
    public visible: boolean;
    public vertices: [Point3D, Point3D, Point3D];

    constructor(p1: Point3D, p2: Point3D, p3: Point3D)
    {
        this.visible = false;
        this.vertices = [p1, p2, p3];
    }

    public reverse(): void
    {
        [this.vertices[0], this.vertices[2]] = [this.vertices[2], this.vertices[0]];
    }

    public toString(): string
    {
        return `[face pt1 = ${this.vertices[0].toString()} | face pt2 = ${this.vertices[1].toString()} | face pt3 = ${this.vertices[2].toString()}]`;
    }
}

class Edge
{
    public remove: boolean;
    public adjface1: Face | null;
    public adjface2: Face | null;
    public endpoints: [Point3D, Point3D];

    constructor(p1: Point3D, p2: Point3D)
    {
        this.remove = false;
        this.adjface1 = null;
        this.adjface2 = null;
        this.endpoints = [p1, p2];
    }

    public linkAdjFace(face: Face): void
    {
        if (this.adjface1 !== null && this.adjface2 !== null)
        {
            console.log('warning: property violated!');
        }
        this.adjface1 === null ? (this.adjface1 = face) : (this.adjface2 = face);
    }

    public erase(face: Face): void
    {
        if (this.adjface1 !== face && this.adjface2 !== face)
        {
            return;
        }
        this.adjface1 === face ? (this.adjface1 = null) : (this.adjface2 = null);
    }

    public toString(): string
    {
        return `[edge pt1 = ${this.endpoints[0].toString()} | edge pt2 = ${this.endpoints[1].toString()}]`;
    }
}

class ConvexHull
{

    private faces: Face[];
    private edges: Edge[];
    private volumeSign(f: Face, p: Point3D): number
    {
        let vol: number;
        const ax = f.vertices[0].x - p.x;
        const ay = f.vertices[0].y - p.y;
        const az = f.vertices[0].z - p.z;
        const bx = f.vertices[1].x - p.x;
        const by = f.vertices[1].y - p.y;
        const bz = f.vertices[1].z - p.z;
        const cx = f.vertices[2].x - p.x;
        const cy = f.vertices[2].y - p.y;
        const cz = f.vertices[2].z - p.z;
        vol = ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx);
        if (vol === 0)
        {
            return 0;
        }
        return vol < 0 ? -1 : 1;
    }

    private colinear(a: Point3D, b: Point3D, c: Point3D): boolean
    {
        return (
            (c.z - a.z) * (b.y - a.y) - (b.z - a.z) * (c.y - a.y) === 0 &&
            (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z) === 0 &&
            (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) === 0
        );
    }

    private addOneFace(a: Point3D, b: Point3D, c: Point3D, inner_pt: Point3D): void
    {
        // Make sure face is CCW with face normal pointing outward
        const new_face = new Face(a, b, c);
        if (this.volumeSign(new_face, inner_pt) < 0)
        {
            new_face.reverse();
        }
        this.faces.push(new_face);

        // Create edges and link them to face pointer
        const create_edge = (p1: Point3D, p2: Point3D) =>
        {
            //check if edge already exists and return its index
            let index = this.edges.findIndex((edge) => edge.endpoints[0] === p1 && edge.endpoints[1] === p2);
            if (index === -1)
            {
                const new_edge = new Edge(p1, p2);
                this.edges.push(new_edge);
                index = this.edges.length - 1;
            }
            this.edges[index].linkAdjFace(new_face);
        };
        create_edge(a, b);
        create_edge(a, c);
        create_edge(b, c);
    }

    private BuildFirstHull(pointcloud: Point3D[]): boolean
    {
        const n = pointcloud.length;
        if (n <= 3)
        {
            console.log("Tetrahedron: points.size() < 4");
            return false;
        }

        let i = 2;
        while (this.colinear(pointcloud[i], pointcloud[i - 1], pointcloud[i - 2]))
        {
            if (++i === n)
            {
                console.log("Tetrahedron: All points are colinear!");
                return false;
            }
        }

        const face = new Face(pointcloud[i], pointcloud[i - 1], pointcloud[i - 2]);

        let j = i;
        while (!this.volumeSign(face, pointcloud[j]))
        {
            if (++j === n)
            {
                console.log("Tetrahedron: All pointcloud are coplanar!");
                return false;
            }
        }

        const p1 = pointcloud[i];
        const p2 = pointcloud[i - 1];
        const p3 = pointcloud[i - 2];
        const p4 = pointcloud[j];
        p1.processed = p2.processed = p3.processed = p4.processed = true;
        this.addOneFace(p1, p2, p3, p4);
        this.addOneFace(p1, p2, p4, p3);
        this.addOneFace(p1, p3, p4, p2);
        this.addOneFace(p2, p3, p4, p1);
        return true;
    }

}

