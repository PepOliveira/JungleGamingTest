const IMAGE_WIDTHS = [320, 640, 960] as const
const SIZED_IMAGE_PATTERN = /-\d+\.webp$/

export function imageSrcSet(url: string) {
  if (!SIZED_IMAGE_PATTERN.test(url)) {
    return undefined
  }
  return IMAGE_WIDTHS.map(
    (width) => `${url.replace(SIZED_IMAGE_PATTERN, `-${width}.webp`)} ${width}w`,
  ).join(', ')
}
