import { HydrateElement } from "../interfaces"
import { DCLConnectLayout } from "./Layout"

export class DCLConnectVenue extends Entity {
    constructor(uuid: string){
        super()
        log('Created a Venue')
    }

    onChange(name: string, callback: ({ next }:HydrateElement)=>void){

    }

    loadExperience(uuid: string){}

    getLayout(uuid: string): DCLConnectLayout {
        return new DCLConnectLayout()
    }

    getLayouts(): DCLConnectLayout[] {
        return [new DCLConnectLayout()]
    }

    getGallery(uuid: string){}
    getGalleries(){}

    getEvent(uuid: string){}
    getEvents(){}

    loadEvent(uuid: string){} // I don't think this a thing actually
}
