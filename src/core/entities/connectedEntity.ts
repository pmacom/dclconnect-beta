import utils from '../utils/utils'
import { IPosition } from './interfaces'

export abstract class DCLConnectedEntity extends Entity {
    constructor(public settings: { [key:string]: any }){
        super()
    }

    update(settingName: string, value: any){
        log('Updating value', settingName, value)
        const path = settingName.split('.')
        utils.set(this.settings, path, value)
        if(path[0] == 'position') this.setPosition(this.settings.position)
        if(path[0] == 'enabled') this.setEnabled(this.settings.enabled)
        this.onUpdate(settingName, value)
    }

    setPosition(position: IPosition){
        log('Setting this position', position)
        this.addComponentOrReplace(new Transform({
            position: new Vector3(position.positionX, position.positionY, position.positionZ),
            scale: new Vector3(position.scaleX, position.scaleY, position.scaleZ),
            rotation: new Quaternion().setEuler(position.rotationX, position.rotationY, position.rotationZ)
        }))
    }

    setEnabled(enabled: boolean){
        if(enabled){
            if(!this.alive) engine.addEntity(this)
        }else{
            if(this.alive) engine.removeEntity(this)
        }
    }

    abstract onUpdate(settingName: string, value: any): void
}