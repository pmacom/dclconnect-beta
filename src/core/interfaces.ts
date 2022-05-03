export enum DCLConnectHydrateEntityType {
    Land,
    Venue,
    Event,
    Experience,
    Layout,
    Gallery,
    Entity,
    Zone
}

export interface DCLConnectHydrateSetting {
    entity: Entity
    type: DCLConnectHydrateEntityType
}

export interface IDCLConnectState {
    landEntity: Entity | null,
    landUUID: string | null,
}

export interface IDCLConnectInitialPayload {
    uuid: any
    type: any
    updates: any
}

export enum HydrateAction {
    CREATE = "N",
    DELETE = "D",
    UPDATE = "E",
    SORT = "A"
}

export const HydrateTypes = {
    'N': HydrateAction.CREATE,
    'D': HydrateAction.DELETE,
    'E': HydrateAction.UPDATE,
    'A': HydrateAction.SORT,
}

export interface DCLConnectListener {
    value: any,
    onCreate: (change: HydrateElement) => void,
    onUpdate: (change: HydrateElement) => void,
    onDelete: (change: HydrateElement) => void,
    onSort: (change: HydrateElement) => void,
}

export interface HydrateElement {
    action: HydrateAction
    path: string[]
    attribute: string
    next?: any
    prev?: any
    index?: number
    item?: any
}

export interface LandBarrierUserList {
    id: number
    name: string
    address: string
}