// Make a sharp AVIF from an original image (macOS, no installs needed).
// Run:  swift tools/avif.swift <original.png> <out.avif> 2560 0.88
// Optional background for see-through areas: add "r g b" (default is the dark site color 12 21 28;
// use 243 239 228 for a .light.avif). Keeps the original pixels 1:1 up to the size limit.
import Foundation
import ImageIO
import UniformTypeIdentifiers
let a = CommandLine.arguments
let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil)!
let opts: [CFString: Any] = [kCGImageSourceCreateThumbnailFromImageAlways: true,
                             kCGImageSourceThumbnailMaxPixelSize: Int(a[3])!,
                             kCGImageSourceCreateThumbnailWithTransform: true,
                             kCGImageSourceShouldCacheImmediately: true]
let thumb = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary)!
// Flatten any transparency onto the site background (#0C151C): the AVIF encoder drops alpha.
let W = thumb.width & ~1, H = thumb.height & ~1  // even dimensions: odd sizes decode blank in some browsers
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0,
                    space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
let bg = a.count > 7 ? (Double(a[5])!, Double(a[6])!, Double(a[7])!) : (12.0, 21.0, 28.0)
ctx.setFillColor(red: bg.0/255, green: bg.1/255, blue: bg.2/255, alpha: 1)
ctx.interpolationQuality = .high
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
// draw 1:1 (no rescale); an odd edge just loses its last pixel row/column
ctx.draw(thumb, in: CGRect(x: 0, y: H - thumb.height, width: thumb.width, height: thumb.height))
let img = ctx.makeImage()!
let dst = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, "public.avif" as CFString, 1, nil)!
CGImageDestinationAddImage(dst, img, [kCGImageDestinationLossyCompressionQuality: Double(a[4])!] as CFDictionary)
if !CGImageDestinationFinalize(dst) { print("FAILED", a[2]); exit(1) }
print(img.width, img.height)
