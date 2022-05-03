import { DCLConnect } from "../connect"

/* Similar to _.set in lodash */
const set = (obj: any, path: any, value: any) => {
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g)
    pathArray.reduce((acc: any, key: any, i: any) => {
      if (acc[key] === undefined) acc[key] = {}
      if (i === pathArray.length - 1) acc[key] = value
      return acc[key]
    }, obj)
}

export const getImageURL = (image: any) => {
  const { large, medium, small, thumbnail } = image.formats;
  const format = ( large    ? large 
                 : medium   ? medium 
                 : small    ? small 
                 : thumbnail! );
  if(format.url.indexOf('https://') == -1 && DCLConnect.previewMode) {
    return `http://localhost:1337${format.url}`
  }
  return format.url
}

export default {
  set,
  getImageURL
}