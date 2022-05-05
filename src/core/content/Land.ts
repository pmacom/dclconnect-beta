import { DCLConnect } from "../connect"
import { DCLConnectState } from "../state"
import { DCLConnectElement } from "../element"
import { HydrateTypes, HydrateAction, HydrateElement, DCLConnectHydrateEntityType, LandBarrierUserList } from "../interfaces"
import { DCLConnectScreen } from "../entities/screen"
import { DCLConnectPictureFrame } from "../entities/pictureFrame"
import { DCLConnectPOAP } from "../entities/poap"
import { DCLConnectedEntity } from "../entities/connectedEntity"
import { DCLConnectVenue } from "./Venue"
import { DCLConnectGallery } from "./Gallery"
import { DCLConnectExperience } from "./Experience"
import { getLandBarrierData } from "../utils/getLandBarrierData"

declare const Map: any
declare const Set: any

import { Dash_LandBarrier } from "dcldash"

export abstract class DCLConnectLand extends Entity {
    private initialized: boolean = false
    public attributes: typeof Map = new Map()
    private entities: typeof Map = new Map()
    private settings: typeof Map = new Map()
    // public attributes: Map<string, DCLConnectElement> = new Map()
    // private entities: Map<string, Entity> = new Map()
    // private settings: Map<string, DCLConnectElement> = new Map()
    private landBarrier: Dash_LandBarrier | undefined
    private privateEvent: boolean = true
    private barrierMessage: string = "accountrequired"
    private whitelist: typeof Set = new Set()
    private blacklist: typeof Set = new Set()
    // private whitelist: _Set<string> = new _Set()
    // private blacklist: _Set<string> = new _Set()

    constructor(){
        super()
        this.setLandEntity()
        executeTask(async () => {
            const { base, parcels, maxHeight } = await getLandBarrierData()
            log('HYDRATE::', 'Awaited parcel data')
            this.landBarrier = new Dash_LandBarrier(new Vector3(0, 0, 16.00001))
            this.landBarrier.setMessage(this.barrierMessage)
        })
    }

    private setLandEntity(){
        if(!DCLConnectState.landEntity){
            DCLConnectState.landEntity = this
        }else{ this.warnLandEntity()}
    }

    private warnLandEntity(){
        // TODO: Display a warning in the UI
        log('DCLConnect: Warning: You should only have one Land entity per scene')
    }

    private warnFailedFetch(){
        // TODO: Display a warning in the UI
        log("failed to reach URL")
    }

    addListener(attribute: string): DCLConnectElement {
        let element = new DCLConnectElement()
        this.attributes.set(attribute, element)
        return element
    }

    fetchData(url: string): any{
        log('DCLC Fetching initial Land data (signed fetch)', url)

        executeTask(async () => {
            try {
                let response = await fetch(url)
                let data = await response.json()
                log('HYDRATE::', 'Parent Land getting data done')
                if(data.uuid){
                    const { uuid, resources, settings, entities } = data
                    DCLConnectState.landUUID = uuid
                    DCLConnect.subscribe(uuid, DCLConnectHydrateEntityType.Land, this)
                    this.init(data)
                }
                return data
            } catch {
                log('DCLC FAILURE')
                this.warnFailedFetch()
            }
        })
    }

    init(data: any){
        const { 
            // components, 
            entities, 
            settings, 
            venues, 
            resources,
            privateEvent,
            barrierMessage,
            whitelist,
            blacklist,
        } = data;

        log('HYDRATE::', 'doing init on main land')

        this.privateEvent = privateEvent
        this.barrierMessage = barrierMessage
        whitelist.forEach((user: LandBarrierUserList) => {
            log('HYDRATE:: Whitelisted User Found:', user)
            const { address } = user
            this.whitelist.add(address.toLowerCase())
        })
        blacklist.forEach((user: LandBarrierUserList) => {
            log('HYDRATE:: Blacklisted User Found:', user)
            const { address } = user
            this.blacklist.add(address.toLowerCase())
        })
        this.updateBarrier()

        Object.keys(settings).forEach(setting => {
            if(this.attributes.has(setting)){
                const { onCreate } = this.attributes.get(setting)!
                onCreate(settings[setting])
            }
        })

        Object.keys(entities).forEach(entityName => {
            log("DCLC entity",entityName)
            const entitySettings = entities[entityName]
            const { type } = entitySettings
            switch(type){
                case 'poap':
                    this.entities.set(entityName, new DCLConnectPOAP(entitySettings))
                    break;
                case 'pictureframe':
                    this.entities.set(entityName, new DCLConnectPictureFrame(entitySettings))
                    break;
                case 'curvedScreen':
                case 'planeScreen':
                    this.entities.set(entityName, new DCLConnectScreen(entitySettings))
                    break;
            }
            log('DCLC Adding an entity', entityName, entitySettings)
        })
        
        Object.keys(resources).forEach(resourceGroupName => {
            const resourceGroup = resources[resourceGroupName]
            
            Object.keys(resourceGroup).forEach(uuid => {
                const resource = resourceGroup[uuid]
                const { type } = resource
                switch(type){
                    case 'venue':
                        const venue = new DCLConnectVenue(uuid)
                        DCLConnect.subscribe(uuid, DCLConnectHydrateEntityType.Venue, venue)
                        break
                    case 'gallery':
                        const gallery = new DCLConnectGallery()
                        DCLConnect.subscribe(uuid, DCLConnectHydrateEntityType.Gallery, gallery)
                        break
                    case 'experience':
                        const experience = new DCLConnectExperience()
                        DCLConnect.subscribe(uuid, DCLConnectHydrateEntityType.Experience, experience)
                        break
                }
                log('DCLC Adding a resource of type', type)
            })
        })

        venues.forEach((venue: any) => {
            const { name, venue: uuid } = venue
            log({ name, uuid })
        })
    }

    private updateBarrier(){
        if(!this.privateEvent){
            this.landBarrier!.disable()
        }else{
            const onWhiteList = this.checkWhiteList()
            if(onWhiteList){
                this.landBarrier!.disable()
            }else{
                this.landBarrier!.enable()
                this.landBarrier!.setMessage(this.barrierMessage)
            }
        }
    }

    private checkWhiteList(): boolean {
        return this.whitelist.has(DCLConnect.userData?.publicKey!)
    }

    private checkBlackList(): boolean {
        return this.blacklist.has(DCLConnect.userData?.publicKey!)
    }

    hydrate(payload: any){
        log('DCLC Payload!!!', { payload })
        payload.forEach((change: HydrateElement) => {
            const { path, next } = change
            // const [scheme, attribute, ...settings] = path
            const scheme = path[0]
            const attribute = path[1]
            const settings = path.slice(2)
            const action = HydrateTypes[change.action]
            if(scheme == 'entities'){
                if(this.entities.has(attribute)){
                    const entity = this.entities.get(attribute) as DCLConnectedEntity
                    entity.update(settings.join('.'), next)
                }
            }

            if(scheme == 'whitelist'){
                log('HYDRATE::', 'Updating the whitelist', change)
                if(action == HydrateAction.SORT){
                    const { item } = change
                
                    if(item.kind == HydrateAction.DELETE){
                        const address = item.lhs.address
                        this.whitelist.delete(address.toLowerCase())
                    }

                    if(item.kind == HydrateAction.CREATE){
                        const address = item.rhs.address
                        this.whitelist.add(address.toLowerCase())
                    }
                }
                this.updateBarrier()
            }

            if(scheme == 'blacklist'){
                log('HYDRATE::', 'UPDATING THE BLACKLIST')
            }

            if(scheme == 'privateEvent'){
                this.privateEvent = next
                this.updateBarrier()
                log('HYDRATE::', 'Private event was updated')
            }
            if(scheme == 'barrierMessage'){
                this.barrierMessage = next
                this.updateBarrier()
                log('HYDRATE::', 'Barrier Message was updated')
            }

            log({ action })
            switch(action){
                case HydrateAction.CREATE:
                    log('Creating', scheme)
                    this.attributes.get(attribute)?.onCreate(change)
                    break
                case HydrateAction.DELETE:
                    this.attributes.get(attribute)?.onDelete(change)
                    break
                case HydrateAction.UPDATE:
                    this.attributes.get(attribute)?.onUpdate(change)
                    break
                case HydrateAction.SORT:
                    this.attributes.get(attribute)?.onSort(change)
                    break
            }
        })
    }
}
