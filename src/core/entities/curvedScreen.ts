import { Dash_UV_Curved_Video } from "dcldash"

const points = [
    new Vector3(1.8287944793701172,0.0,-7.059377193450928),
    new Vector3(0.03668500483036041,0.0,-5.077810764312744),
    new Vector3(-1.1056969165802002,0.0,-2.654768943786621),
    new Vector3(-1.4991079568862915,0.0,-0.0007417933084070683),
    new Vector3(-1.1093659400939941,0.0,2.6536736488342285),
    new Vector3(0.029663074761629105,0.0,5.077843189239502),
    new Vector3(1.8190292119979858,0.0,7.061182022094727),
]
let dist = Vector3.Distance(points[0], points[1])

export class DCLConnectCurvedScreen extends Entity {
    public planes: Entity[] = []

    constructor(){
        super()
        points.forEach((point: Vector3, index: number) => {
            let plane = new Entity()
            let transform = new Transform({
                position: point,
                scale: new Vector3(dist+0.05, 10, 1)
            })
            let shape = new PlaneShape()
            plane.addComponent(shape)
            plane.addComponent(transform)
            const curve = 7.64735
            transform.lookAt(new Vector3(
                curve,
                0,
                0,
            ))
            plane.setParent(this)
            let uvs = Dash_UV_Curved_Video(points.length, index)
            shape.uvs = uvs
            this.planes.push(plane)
        })
        engine.addEntity(this)
    }
}