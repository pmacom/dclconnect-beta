import { POAPBooth, AlertSystem } from 'zootools';
import { DCLConnectedEntity } from "./connectedEntity";
import { IPosition } from "./interfaces";
import { DCLConnect } from '../connect';

// const alertSystem = new AlertSystem()

export interface IPOAPBooth {
    type: string;
    label: null | string;
    eventId: number;
    apiKey: string;
    propertyName: string;
    secondsTillEnabled: null | number;
    useLayout: null | boolean;
    name: null | string;
    adminOnly: boolean;
    layoutIndex: null;
    enabled: boolean;
    position: IPosition;
}

let booth_number = 0;

export class DCLConnectPOAP extends DCLConnectedEntity {
    booth: POAPBooth | undefined
    constructor(settings: any){
        super(settings)
        booth_number++;
        const { position, enabled } = settings
        executeTask(async () => {
            // this.booth = new POAPBooth(
            //     {
            //         transformArgs: {
            //             position: new Vector3().setAll(0),
            //         },
            //         wrapTexturePath: "poap_assets/images/wrap2.png",
            //         onButtonClick: () => {
            //             // alertSystem.new("The dispenser is empty", 5000)
            //         }
            //     },
            //     {
            //         event_id: settings.eventId,
            //         booth_number,
            //         property: settings.propertyName,
            //         api_key: settings.apiKey,
            //         userData: DCLConnect.userData!,
            //         realm: DCLConnect.realm!,
            //     },
            //     alertSystem
            // );
            // this.booth.setParent(this)
        })
        if(position) this.setPosition(position);
        if(enabled) engine.addEntity(this);
        log('Created a poap booth', settings)
    }
    onUpdate(){
        log('my settings have changed', this.settings)
    }
}