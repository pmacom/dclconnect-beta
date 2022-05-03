import { HydrateElement } from "./interfaces"

export class DCLConnectElement {
    public value: any
    public onCreate: (change: HydrateElement) => void = () => {}
    public onUpdate: (change: HydrateElement) => void = () => {}
    public onDelete: (change: HydrateElement) => void = () => {}
    public onSort: (change: HydrateElement) => void = () => {}
}