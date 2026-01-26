export const encodeLSB = (
    sourceCanvas: HTMLCanvasElement,
    text: string,
    overlayText?: string,
    overlayPosition?: 'center' | 'bottom'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const width = sourceCanvas.width
            const height = sourceCanvas.height

            // Create a temporary canvas
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = width
            tempCanvas.height = height
            const ctx = tempCanvas.getContext('2d')

            if (!ctx) {
                reject(new Error('Could not get 2D context'))
                return
            }

            // Draw the source WebGL canvas onto the 2D canvas
            ctx.drawImage(sourceCanvas, 0, 0)

            // Draw Overlay Text if provided
            if (overlayText) {
                // High resolution sizing
                const fontSize = Math.floor(height * 0.05) // 5% of height
                ctx.font = `500 ${fontSize}px Inter, sans-serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'

                // Shadow for readability
                ctx.shadowColor = 'rgba(0,0,0,0.5)'
                ctx.shadowBlur = 20
                ctx.shadowOffsetX = 0
                ctx.shadowOffsetY = 10

                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'

                let x = width / 2
                let y = height / 2

                if (overlayPosition === 'bottom') {
                    y = height - (height * 0.1) // 10% from bottom
                }

                ctx.fillText(overlayText, x, y)

                // Reset shadow
                ctx.shadowColor = 'transparent'
            }

            const imgData = ctx.getImageData(0, 0, width, height)
            const data = imgData.data

            // Prepare the message: text + NULL terminator
            const message = text + '\0'
            const binaryMessage = Array.from(message)
                .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
                .join('')

            if (binaryMessage.length > data.length / 4) {
                console.warn('Text is too long to hide in this image. Truncating.')
            }

            // Embed message in the LSb of the Blue channel (index 2, 6, 10...)
            // Alternatively, spread across RGB. Simple approach: Use consecutive pixels mostly.
            // We will modify the R, G, and B channels sequentially to pack it tighter.
            // data: [R, G, B, A, R, G, B, A ...]

            let msgIndex = 0
            for (let i = 0; i < data.length; i++) {
                // Skip Alpha channel (every 4th byte, index 3, 7, 11...)
                if ((i + 1) % 4 === 0) continue;

                if (msgIndex < binaryMessage.length) {
                    const bit = binaryMessage[msgIndex]
                    // Clear LSB and OR with new bit
                    data[i] = (data[i] & 0xFE) | parseInt(bit, 10)
                    msgIndex++
                } else {
                    break
                }
            }

            ctx.putImageData(imgData, 0, 0)
            resolve(tempCanvas.toDataURL('image/png', 1.0))
        } catch (e) {
            reject(e)
        }
    })
}

export const decodeLSB = (imageSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "Anonymous"
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (!ctx) return reject('No context')

            ctx.drawImage(img, 0, 0)
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

            let binary = ''
            let result = ''

            for (let i = 0; i < data.length; i++) {
                // Skip Alpha
                if ((i + 1) % 4 === 0) continue

                // Get LSB
                binary += (data[i] & 1).toString()

                if (binary.length === 8) {
                    const charCode = parseInt(binary, 2)
                    if (charCode === 0) {
                        resolve(result) // Null terminator found
                        return
                    }
                    result += String.fromCharCode(charCode)
                    binary = ''
                }
            }
            resolve(result)
        }
        img.onerror = reject
        img.src = imageSrc
    })
}
