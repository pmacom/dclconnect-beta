export interface IPosition {
    adminOnly: boolean
    enabled: boolean
    id: number
    key: string
    label: string
    name: string
    positionX: number
    positionY: number
    positionZ: number
    scaleX: number
    scaleY: number
    scaleZ: number
    rotationX: number
    rotationY: number
    rotationZ: number
}

export interface IImageSize {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: null | string;
    size: number;
    width: number;
    height: number;
}

export interface IImageFormats {
    large?: IImageSize;
    medium?: IImageSize;
    small?: IImageSize;
    thumbnail?: IImageSize;
}

export interface IImageData {
    alternativeText: string
    caption: string
    ext: string
    hash: string
    height: number
    id: number
    mime: string
    name: string
    previewUrl: string
    provider: string
    provider_metadata: any
    size: number
    updatedAt: string
    url: string
    width: number
    formats: IImageFormats
}