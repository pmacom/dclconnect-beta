import { Client, Room } from 'colyseus.js';
import { getCurrentRealm, isPreviewMode, Realm } from '@decentraland/EnvironmentAPI';
import { getUserData, UserData } from '@decentraland/Identity';
import { getProvider, Provider } from '@decentraland/web3-provider';
import { getParcel, ILand } from '@decentraland/ParcelIdentity';
import { movePlayerTo, PositionType } from "@decentraland/RestrictedActions"
import { DCLConnectHydrateMap, DCLConnectState } from './state';
import { DCLConnectLand } from './content/Land';
import { DCLConnectHydrateEntityType, DCLConnectHydrateSetting, IDCLConnectInitialPayload } from './interfaces';
// import { Dash_Wait } from 'dcldash';

export interface DCLConnectSettings {
    base?: string
    apiURL?: string
    wsURL?: string
}

interface IURLs { apiURL: string, wsURL: string };

export class DCLConnectInstance {
    public client: Client | null = null
    public room: Room | undefined
    public relay: Room | undefined
    public urls: IURLs = {
        apiURL: `http://localhost:1337`,
        wsURL: `ws://localhost:2567`,
    }
    public useLocal: boolean = false
    public userData: UserData | null = null
    public realm: Realm | undefined | null = null
    public provider: Provider | undefined | null = null
    public previewMode: boolean | null = null
    public address: string | undefined
    public parcel: { land: ILand, cid: string } | undefined
    public baseParcel: string | undefined
    public initialized: boolean = false
    public isIdle: boolean = false
    public inScene: boolean = false
    public isSceneLoaded: boolean = false

    private isCurrentUser(userId: string): boolean { 
        return this.userData?.userId.toLowerCase() === userId.toLowerCase(); 
    }
    
    //Handle reconnects
    private attempts = 0
    private attemptDelay = 1000;
    private attemptDelayMultipler = 2
    private maxDelay = 15000  

    constructor(){}

    public async connect(settings?: DCLConnectSettings){
        if(!this.initialized){
            executeTask(async () => {
                this.userData = await getUserData();
                this.realm = await getCurrentRealm();
                this.provider = await getProvider();
                this.previewMode = await isPreviewMode();
                this.parcel = await getParcel();
                this.initialized = true;
                this.baseParcel = this.parcel?.land.sceneJsonData.scene.base;
                if (this.previewMode) this.addConnectionDebugger("Connecting...");

                const useProd = !this.previewMode || !this.useLocal;
                if(useProd && settings){
                    this.urls = {
                        apiURL: settings.apiURL!,
                        wsURL: settings.wsURL!
                    }
                }

                onEnterSceneObservable.add((player) => {
                    if(this.isCurrentUser(player?.userId)) this.inScene = true
                    this.room?.send('onEnterScene')
                    log('DCLC user entered scene', player)
                })
                
                onLeaveSceneObservable.add((player) => {
                    if(this.isCurrentUser(player?.userId)) this.inScene = false
                    this.room?.send('onLeaveScene')
                    log('DCLC user left scene', player)
                })

                onIdleStateChangedObservable.add(({ isIdle }) => {
                    this.isIdle = isIdle
                    this.room?.send('onIdleStateChanged', isIdle)
                    log('DCLC user is idle', isIdle)
                })

                onProfileChanged.add((data) => {
                    executeTask(async() => {
                        this.userData = await this.getUserData()
                        this.room?.send('onProfileChanged', 'user has changed their profile')
                        log('DCLC profile changed', data)
                    })
                })

                onSceneReadyObservable.add((data) => {
                    this.room?.send('onSceneReady')
                    this.isSceneLoaded = true
                    log("DCLC scene loaded", data)
                })

                onRealmChangedObservable.add((realmChange) => {
                    const { domain, serverName } = realmChange
                    this.room?.send('onRealmChanged', {
                        realmName: serverName,
                        realmDomain: domain,
                    })
                    log("DCLC realm changed", realmChange)
                })
                await this.connectWS()
            })
        }
    }

    private async onConnected(){
        log('Attempting to connect ...', this.userData)
        if(this.userData?.hasConnectedWeb3 || this.previewMode){
            await this.hydrateLand()
        }else{
            // throw up barrier
        }
    }

    public subscribe(uuid: string, type: DCLConnectHydrateEntityType, entity: Entity){
        log('Subscribing to uuid', uuid)
        this.room?.send('subscribe', uuid)
        DCLConnectHydrateMap.set(uuid, { type, entity })
    }

    private async hydrateLand(){
        log('hydrating the land!', DCLConnectState)
        if(DCLConnectState.landEntity){
            let land = DCLConnectState.landEntity as DCLConnectLand
            await land.fetchData(`${this.urls.apiURL}/api/lands/${this.baseParcel}`)
        }
    }

    private async getUserData(){
        const userData = await getUserData()
        return userData
    }

    private getSessionData(){
        return {
            displayName: this.userData?.displayName,
            address: this.userData?.publicKey?.toLowerCase(),
            userId: this.userData?.userId,
            realmName: this.realm?.serverName,
            realmDomain: this.realm?.domain,
            sceneName: this.parcel?.land.sceneJsonData.display?.title,
            baseParcel: this.parcel?.land.sceneJsonData.scene.base,
            previewMode: this.previewMode,
            inScene: this.inScene,
            isSceneLoaded: this.isSceneLoaded,
            isIdle: this.isIdle,
            imageUrl: this.userData?.avatar.snapshots.face,
            isGuest: !!!this.userData?.publicKey,
        }
    }

    public movePlayerTo(newPosition: PositionType, camTarget?: PositionType) {
        if(!camTarget){
            camTarget = newPosition
            camTarget.x += 1
            camTarget.z += 1
        }
        movePlayerTo(newPosition, camTarget)
    }

    private async connectWS(){
        try {
            this.attempts++;
            const options = this.getSessionData()
            this.client = new Client(this.urls.wsURL);
            this.room = await this.client?.joinOrCreate('dclconnect', options);
            if (this.previewMode) this.updateConnectionDebugger(this.room); 
            this.room?.onMessage('update', (update: IDCLConnectInitialPayload ) => {
                const { type, updates, uuid } = update
                if(DCLConnectHydrateMap.has(uuid)){
                    const hydrateSetting = DCLConnectHydrateMap.get(uuid)
                    const { type, entity } = hydrateSetting as DCLConnectHydrateSetting
                    log('HYDRATE::!!!', { hydrateSetting })
                    switch(type){
                        case DCLConnectHydrateEntityType.Land:
                            const land = entity as DCLConnectLand
                            log('HYDRATE::', land)
                            land.hydrate(updates)
                            break;
                        default:
                            break;
                    }
                }
            })
            this.room?.onLeave(() => this.onLeave())
			this.onConnected()
            return true
        } catch (e: any) { this.onConnectionError(e); return false }
    }
    

    private onLeave(){
        log('DCLC: WSS', 'Left server')
    }
    private onConnectionError(e: any){
        log('DCLC: WSS', 'ERROR', 'Cannot connect', e.message)
        this.onConnectionLost()
        this.hydrateLand()
        throw(e)
    }
    //Debugger message
    message: UIText | null = null

    private addConnectionDebugger(endpoint: string) {
        const canvas = new UICanvas()
        if(!this.message) this.message = new UIText(canvas)
        this.message.fontSize = 15
        this.message.width = 120
        this.message.height = 30
        this.message.hTextAlign = "center";
        this.message.vAlign = "bottom"
        this.message.positionX = -80
        this.updateConnectionMessage(`Connecting to ${endpoint}`, Color4.White());
    }

    private updateConnectionMessage(value: string, color: Color4) {
        if(!this.message) return
        this.message.value = value;
        this.message.color = color;
    }

    private onConnectionLost(){
        this.updateConnectionMessage("Not connected", Color4.Red())
        let timeout = this.attempts * this.attemptDelay * this.attemptDelayMultipler
        if(timeout > this.maxDelay) timeout = this.maxDelay
        let wait = timeout / 1000;
        log(`Waiting ${wait} seconds for next attempt`)
        // Dash_Wait(()=>{ this.connectWS(); },wait);
    }

    private updateConnectionDebugger(room: Room) {
        this.updateConnectionMessage(`Connected to ${room.name}!`, Color4.Green());
    }

}

export const DCLConnect = new DCLConnectInstance();
