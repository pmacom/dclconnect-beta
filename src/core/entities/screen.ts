import { DCLConnectedEntity } from "./connectedEntity"
import { IPosition } from "./interfaces"
import { Dash_OnFirstMove } from "dcldash"
import { DCLConnectCurvedScreen } from "./curvedScreen"
import { makeid } from "zootools"
import { getImageURL } from '../utils/utils'

declare const Map: any

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
        Dash_OnFirstMove(() => {
            this.vt!.play()
        })
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

export const videoMaterialMap: typeof Map = new Map()
// Map<string, { entities: Entity[], vm: VideoMaterial }>


export function createOrUpdateVideoMaterial({ entity, url }:{
    entity: Entity;
    url: string;
}){ 
    
    let masterVm: VideoMaterial | undefined;
    let reuseVm: VideoMaterial | undefined;

    for(const [urlKey, { entities, vm }] of videoMaterialMap){
        const hasEntity = entities.indexOf(entity) > -1;
        const isSolo = entities.length === 1;
        const urlChanged = urlKey !== url;
        if(hasEntity && isSolo && urlChanged){ 
            reuseVm = vm;
        };
    }

    if(!videoMaterialMap.has(url)){
        masterVm = reuseVm || new VideoMaterial(undefined, makeid(5));
        videoMaterialMap.set(url, { vm: masterVm, entities: [] });
        log(`DCLC createOrGetMaterial created url ${url}`, masterVm.vt?.videoClipId)
    }else{
        log(`DCLC createOrGetMaterial found url ${url}`)
    }
    const item = videoMaterialMap.get(url)!

    for(const [urlKey, { entities, vm }] of videoMaterialMap){
        const entityIdx = entities.indexOf(entity);
        if(entityIdx > -1){ 
            entities.splice(entityIdx, 1)
            if(entities.length === 0){
                log("DCLC detected a rouge VideoMaterial that should be killed", vm)
                vm!.vt!.playing = false;
                vm.vt!.reset();
                videoMaterialMap.delete(urlKey);
            }
        };
        if(url === urlKey) entities.push(entity);
    }
    masterVm?.setURL(url);
    if(masterVm?.vt?.playing === false) masterVm.setPlaying(true);
    return item.vm
}


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
        
        this.vm = createOrUpdateVideoMaterial({
            entity: this,
            url
        })
        this.vm?.setLoop(loop as boolean);
        this.vm?.setVolume(volume as number /100);
        // this.vm.setPlaying(true);
        switch(type){
            case "planeScreen":
                this.screen = new SimpleVideo()
                this.screen.setParent(this)
                this.screen.addComponent(new OnPointerDown(() => {
                    this.vm!.setPlaying(this.vm?.vt?.playing! || false)
                }))
                this.setScreenTexture()
            break;
            case "curvedScreen":
                this.curved = new DCLConnectCurvedScreen()
                this.curved.setParent(this)
                this.curved.addComponent(new OnPointerDown(() => {
                    this.vm!.setPlaying(this.vm?.vt?.playing! || false)
                }));
                this.vm?.addEntity(this.curved.planes)
            break;
        }
    }

    setScreenTexture(){
        const { placeholderImage, showPlaceholder } = this.settings
        log({ placeholderImage, showPlaceholder })
        if(placeholderImage && showPlaceholder) {
            if(!this.pm) this.pm = new Material()
            const placeholder = getImageURL(placeholderImage)
            this.pm.albedoTexture = new Texture(placeholder)
            this.pm.emissiveTexture = new Texture(placeholder)
            this.pm.emissiveColor = Color3.White()
            this.screen!.addComponentOrReplace(this.pm)
            this.screen!.shape.uvs = [ 0,0, 1,0, 1,1, 0,1, 1,0, 0,0, 0,1, 1,1 ]
        }else{
            this.vm = createOrUpdateVideoMaterial({ 
                entity: this, 
                url: this.settings.url as string
            })
            // TODO: Replace with updated dcldash function 0.0.21 (when released)
            let uv = [ 0,1, 1,1, 1,0, 0,0, 1,1, 0,1, 0,0, 1,0 ]
            this.screen!.shape.uvs =  uv // [...uv, ...uv]
            //this.screen!.shape.uvs = Dash_UV_Video()
            this.vm!.addEntity(this.screen!)
        }
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
