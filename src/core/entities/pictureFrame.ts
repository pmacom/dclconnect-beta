// import { Dash_SimplePoster } from "dcldash"
import utils from "../utils/utils"
import { DCLConnectedEntity } from "./connectedEntity"
import { IImageData, IImageFormats, IPosition } from "./interfaces"

export interface IPictureFrame {
    enabled: boolean
    adminOnly: boolean
    author: string
    hyperlink: string
    image: IImageData
    label: string
    layout: any
    layoutIndex: any
    name: string
    src: string
    useLayout: boolean
    position: IPosition
}

export class DCLConnectPictureFrame extends DCLConnectedEntity {
    //private poster: Dash_SimplePoster = new Dash_SimplePoster()

    constructor(public settings: IPictureFrame){
        super(settings)
        // const { hyperlink, position, enabled } = settings
        // if(hyperlink) this.poster.setHyperlink(hyperlink);
        // if(position) this.setPosition(position);
        // if(enabled) engine.addEntity(this);
        // this.poster.setParent(this);
        // this.updateImageUrl();
    }
    onUpdate(key: string, value: any){
        // switch(key){
        //     case 'hyperlink': this.setHyperlink(value); break
        //     case 'url': this.poster.setImageUrl(value); break
        //     default: utils.set(this.settings,key,value); break
        // }
        // this.updateImageUrl()
    }
    updateImageUrl(){
        // const { image, src } = this.settings;
        // const url = this.getImageUrl(image && image.formats || src);
        // this.poster.setImageUrl(url);
    }
    getImageUrl(image: IImageFormats | string | null | undefined): string {
        // if(!image) return '';
        // if(typeof image === "string") return image;
        // const { large, medium, small, thumbnail } = image;
        // const format = ( large    ? large 
        //                : medium   ? medium 
        //                : small    ? small 
        //                : thumbnail! );
        // return format.url
        return ''
    }
    setHyperlink(value: string){
        // if(value){
        //     this.poster.setHyperlink(value)
        // }else{
        //     if(this.poster.hasComponent(OnPointerDown)){
        //         this.poster.removeComponent(OnPointerDown)
        //     }
        // }
    }
}