declare module 'qrious' {
  interface QRiousOptions {
    /**
     * Background color of the QR code
     * @default "white"
     */
    background?: string;
    
    /**
     * Background alpha of the QR code
     * @default 1.0
     */
    backgroundAlpha?: number;
    
    /**
     * Element to render the QR code
     * Must be a canvas or img element
     * @default new canvas element is created
     */
    element?: HTMLCanvasElement | HTMLImageElement;
    
    /**
     * Foreground color of the QR code
     * @default "black"
     */
    foreground?: string;
    
    /**
     * Foreground alpha of the QR code
     * @default 1.0
     */
    foregroundAlpha?: number;
    
    /**
     * Error correction level of the QR code
     * @default "L"
     */
    level?: 'L' | 'M' | 'Q' | 'H';
    
    /**
     * MIME type used to render the image for the QR code
     * @default "image/png"
     */
    mime?: string;
    
    /**
     * Padding for the QR code (pixels)
     * @default null (auto)
     */
    padding?: number | null;
    
    /**
     * Size of the QR code (pixels)
     * @default 100
     */
    size?: number;
    
    /**
     * Value encoded within the QR code
     * @default ""
     */
    value?: string;
  }

  class QRious {
    /**
     * Reference to the canvas element being used to render the QR code
     */
    canvas: HTMLCanvasElement;
    
    /**
     * Reference to the image element being used to render the QR code
     */
    image: HTMLImageElement;
    
    /**
     * Background color of the QR code
     * @default "white"
     */
    background: string;
    
    /**
     * Background alpha of the QR code
     * @default 1.0
     */
    backgroundAlpha: number;
    
    /**
     * Foreground color of the QR code
     * @default "black"
     */
    foreground: string;
    
    /**
     * Foreground alpha of the QR code
     * @default 1.0
     */
    foregroundAlpha: number;
    
    /**
     * Error correction level of the QR code
     * @default "L"
     */
    level: 'L' | 'M' | 'Q' | 'H';
    
    /**
     * MIME type used to render the image for the QR code
     * @default "image/png"
     */
    mime: string;
    
    /**
     * Padding for the QR code (pixels)
     * @default null (auto)
     */
    padding: number | null;
    
    /**
     * Size of the QR code (pixels)
     * @default 100
     */
    size: number;
    
    /**
     * Value encoded within the QR code
     * @default ""
     */
    value: string;

    /**
     * Creates a new QRious instance.
     * @param options - the options to be used
     */
    constructor(options?: QRiousOptions);
    
    /**
     * Updates the options for this QRious instance.
     * @param options - the options to be updated
     * @returns this QRious instance
     */
    set(options: QRiousOptions): this;
    
    /**
     * Generates a base64 encoded data URI for the QR code.
     * @param mime - the MIME type to be used in the data URI (defaults to the mime option)
     * @returns the data URI containing the image data for the QR code
     */
    toDataURL(mime?: string): string;
    
    /**
     * Returns a string representation of this object.
     * @returns the string representation
     */
    toString(): string;
  }

  export default QRious;
} 