// Tags scraped from https://github.com/exif-js/exif-js
export const ExifTags: Record<number, string> = { 0x0112: 'orientation' };
export const AvailableTags = (Object.keys(ExifTags) as unknown as Array<keyof typeof ExifTags>).map((key) => ExifTags[key]);
