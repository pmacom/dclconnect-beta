import { DCLConnectHydrateSetting, IDCLConnectState } from "./interfaces"
// @ts-ignore
import _Map from 'es6-map'
// @ts-ignore
import _Set from 'es6-set' 

export const DCLConnectState: IDCLConnectState = {
    landEntity: null,
    landUUID: null,
}

export const DCLConnectHydrateMap: _Map<string, DCLConnectHydrateSetting> = new _Map()




