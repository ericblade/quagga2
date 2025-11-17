import { findTagsInObjectURL } from './exif_helper';

const ImageLoader = {};
ImageLoader.load = function (directory, callback, offset, size, sequence, config) {
    const htmlImagesSrcArray = new Array(size);
    const htmlImagesArray = new Array(htmlImagesSrcArray.length);
    let i;
    let img;
    let num;

    if (sequence === false) {
        htmlImagesSrcArray[0] = directory;
    } else {
        for (i = 0; i < htmlImagesSrcArray.length; i++) {
            num = (offset + i);
            htmlImagesSrcArray[i] = `${directory}image-${(`00${num}`).slice(-3)}.jpg`;
        }
    }
    htmlImagesArray.notLoaded = [];
    htmlImagesArray.addImage = function (image) {
        htmlImagesArray.notLoaded.push(image);
    };
    htmlImagesArray.loaded = function (loadedImg) {
        const notloadedImgs = htmlImagesArray.notLoaded;
        for (let x = 0; x < notloadedImgs.length; x++) {
            if (notloadedImgs[x] === loadedImg) {
                notloadedImgs.splice(x, 1);
                for (let y = 0; y < htmlImagesSrcArray.length; y++) {
                    const imgName = htmlImagesSrcArray[y].substr(htmlImagesSrcArray[y].lastIndexOf('/'));
                    if (loadedImg.src.lastIndexOf(imgName) !== -1) {
                        htmlImagesArray[y] = { img: loadedImg };
                        break;
                    }
                }
                break;
            }
        }
        if (notloadedImgs.length === 0) {
            if (ENV.development && config?.debug?.showImageDetails) {
                console.log(`Images loaded: ${htmlImagesArray.length} image${htmlImagesArray.length !== 1 ? 's' : ''} from ${sequence === false ? directory : directory + ' (sequence)'}`);
            }
            if (sequence === false) {
                findTagsInObjectURL(directory, ['orientation'])
                    .then((tags) => {
                        htmlImagesArray[0].tags = tags;
                        callback(htmlImagesArray);
                    }).catch((e) => {
                        console.log(e);
                        callback(htmlImagesArray);
                    });
            } else {
                callback(htmlImagesArray);
            }
        }
    };

    for (i = 0; i < htmlImagesSrcArray.length; i++) {
        img = new Image();
        htmlImagesArray.addImage(img);
        addOnloadHandler(img, htmlImagesArray);
        img.src = htmlImagesSrcArray[i];
    }
};

function addOnloadHandler(img, htmlImagesArray) {
    img.onload = function () {
        htmlImagesArray.loaded(this);
    };
}

export default (ImageLoader);
