const IMAGE_EXTENSIONS_BY_TYPE: Record<string, string[]> = {
	'image/jpeg': ['jpg', 'jpeg'],
	'image/png': ['png'],
	'image/webp': ['webp'],
	'image/gif': ['gif'],
	'image/avif': ['avif'],
}

export const ALLOWED_IMAGE_EXTENSIONS = new Set(Object.values(IMAGE_EXTENSIONS_BY_TYPE).flat())

function bytesStartWith(bytes: Uint8Array, expected: number[]) {
	return expected.every((byte, index) => bytes[index] === byte)
}

function ascii(bytes: Uint8Array, start: number, end: number) {
	return String.fromCharCode(...bytes.slice(start, end))
}

export function getFileExtension(filename: string) {
	return filename.split('.').pop()?.toLowerCase() || ''
}

export async function isValidImageFile(file: File, ext: string) {
	const contentType = file.type.toLowerCase()
	const allowedExtensions = IMAGE_EXTENSIONS_BY_TYPE[contentType]
	if (!allowedExtensions?.includes(ext)) {
		return false
	}

	const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer())

	switch (contentType) {
		case 'image/jpeg':
			return bytesStartWith(bytes, [0xff, 0xd8, 0xff])
		case 'image/png':
			return bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
		case 'image/webp':
			return ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP'
		case 'image/gif':
			return ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a'
		case 'image/avif':
			return ascii(bytes, 4, 8) === 'ftyp' && ascii(bytes, 8, 12).startsWith('avi')
		default:
			return false
	}
}

export function isValidTextFile(file: File, ext: string) {
	return ext === 'txt' && (!file.type || file.type === 'text/plain')
}
