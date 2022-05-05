import { DCLConnectedEntity } from "./connectedEntity"
import { IPosition } from "./interfaces"
// import { Dash_OnFirstMove } from "dcldash"
import { DCLConnectCurvedScreen } from "./curvedScreen"
// import { makeid } from "zootools"
import { getImageURL } from '../utils/utils'
// @ts-ignore
import _Map from 'es6-map'
// @ts-ignore
import _Set from 'es6-set' 

export interface IScreen {
    enabled: boolean
    adminOnly: boolean
    label: string
    layout: any
    layoutIndex: number
    loop: boolean
    name: string
    position: IPosition
    setTimeFromNow: string
    startVideoAt: string
    url: string
    useLayout: boolean
    type: "planeScreen" | "curvedScreen"
    defaultImage: string
}

export class PlaceholderMaterial {
    public material: Material = new Material
    constructor(){

    }
}

export class VideoMaterial {
    private vc: VideoClip | undefined
    public vt: VideoTexture | undefined
    public mat: Material = new Material()

    constructor(public src?: string, public randId?: string){
        if(src) this.setURL(src)
    }

    public addEntity(entity: Entity | Entity[]){
        if(!Array.isArray(entity)) entity = [entity]
        entity.forEach(e => {
            if(!e.hasComponent(PlaneShape)) throw Error("Missing plane shape")
            e.addComponentOrReplace(this.mat);
        })
    }

    public setURL(url: string){
        log('DCLC Setting the url', url)
        this.src = url
        // this.vt?.reset()
        this.vc = new VideoClip(this.src) 
        this.vt = new VideoTexture(this.vc)
        this.vt.playing = false;
        this.mat.albedoColor = Color3.White()
        this.mat.albedoTexture = this.vt
        this.mat.emissiveTexture = this.vt
        this.mat.emissiveIntensity = 1
        this.mat.emissiveColor = Color3.White()
        // Dash_OnFirstMove(() => {
        //     this.vt!.play()
        // })
    }

    public setSeek(seconds: number){
        if(this.vt) this.vt.seekTime(seconds);
    }

    public setLoop(loop: boolean){
        if(this.vt) this.vt.loop = loop
    }

    public setPlaying(playing: boolean){
        if(this.vt) this.vt.playing = playing
    }

    public setVolume(vol: number){
        if(this.vt) this.vt.volume = vol
    }
}

interface VideoMaterialSettings {
    entities: _Set<Entity>,
    vm: VideoMaterial
}

export const videoMaterialMap: _Map<string, VideoMaterialSettings> = new _Map()



export class SimpleVideo extends Entity {
    public shape: PlaneShape = new PlaneShape()
    constructor(){
        super()
        this.addComponent(this.shape)
        let uv = [
            0,1,
            1,1,
            1,0,
            0,0,
        ]
        this.shape.uvs = [...uv, ...uv]
        log('This video uv', this.shape.uvs)
    }
    show(){ if(!this.alive) engine.addEntity(this) }
    hide(){ if(this.alive) engine.removeEntity(this) }
}



export class DCLConnectScreen extends DCLConnectedEntity {
    vm: VideoMaterial | undefined
    pm: Material | undefined
    screen: SimpleVideo | undefined
    curved: DCLConnectCurvedScreen | undefined

    constructor(settings: any){
        super(settings)

        const { type, url, position, enabled, loop, volume } = settings
        const { placeholderImage, showPlaceholder } = settings

        if(position) this.setPosition(position)
        if(enabled) this.setEnabled(enabled)
    }

    setScreenTexture(){
    }

    onUpdate(setting: string, value: any){
        log('my settings have changed', this.settings)
        log("onUpdate", setting, value)
        if(setting === "url") {
            this.settings.url = value
            this.setScreenTexture()
        }
        if(setting === "showPlaceholder") {
            this.settings.showPlaceholder = value
            this.setScreenTexture()
        }
        if(setting === "placeholderImage") {
            this.settings.placeholderImage = value
            this.setScreenTexture()
        }
        if(setting === "volume") this.vm?.setVolume(value as number/100)
        if(setting === "loop") this.vm?.setLoop(value as boolean)
    }
}
