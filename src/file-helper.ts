interface IFileNameOptions {
    maxLength?: number;
    invalidChars?: RegExp;
}

interface IFileNameValidationResult {
    result: boolean;
    reason?: "max-length" | "invalid-char";
}

export namespace FileHelper {
    export const isValidFileType = (file: File): boolean => {
        return (
            file.type === "image/png" ||
            file.type === "image/jpg" ||
            file.type === "image/jpeg" ||
            file.type === "application/pdf"
        );
    };

    export const isValidFileName = (
        file: File,
        options: IFileNameOptions
    ): IFileNameValidationResult => {
        if (options.maxLength && file.name.length > options.maxLength) {
            return { result: false, reason: "max-length" };
        }

        if (options.invalidChars && options.invalidChars.test(file.name)) {
            return { result: false, reason: "invalid-char" };
        }

        return { result: true };
    };

    export const isValidSize = (file: File | Blob, maxSize: number) => {
        return file.size < maxSize;
    };

    /**
     * Resamples image by rendering it on canvas
     * @param image image to resample
     * @param options.scale a number between 0 and 1 indicating the dimensions to scale the image to
     * @param options.quality a number between 0 and 1 indicating the image quality to be used, this is only
     * applicable when used on an image format that supports lossy compression (e.g. `image/jpeg`)
     */
    export const resampleImage = async (
        file: File,
        options: { scale: number; quality?: number; type?: string }
    ): Promise<File> => {
        const { scale, quality = 1, type = "image/jpeg" } = options;
        const cvs = document.createElement("canvas");
        const ctx = cvs.getContext("2d");
        const image = await blobToImage(file);

        cvs.width = image.width * scale;
        cvs.height = image.height * scale;
        ctx?.drawImage(image, 0, 0, cvs.width, cvs.height);

        return new Promise((resolve) =>
            cvs.toBlob(
                (blob) => {
                    const resampledFile = new File([blob as Blob], file.name, {
                        type: blob?.type,
                        lastModified: file.lastModified,
                    });
                    resolve(resampledFile);
                },
                type,
                quality
            )
        );
    };

    /**
     * Compresses a file recursively
     * @param file the file to compress
     * @param options.quality a number between 0 and 1 indicating the image quality to be used, this is only applicable
     * when used on an image format that supports lossy compression (e.g. `image/jpeg`)
     * @param options.maxSize a number in bytes indicating the max file size to compress to
     * @param options.minQuality stops recursive compression if quality drops below minQuality
     * @throws error if failed to compress within file size
     */
    export const compressImage = async (
        file: File,
        options: {
            quality?: number;
            maxSize: number;
            minQuality?: number;
        }
    ): Promise<File> => {
        const { quality = 1, maxSize, minQuality = 0.1 } = options;

        if (quality < minQuality || quality <= 0)
            throw new Error("Unable to compress");

        const compressed = await resampleImage(file, {
            scale: 1,
            quality: quality,
        });
        if (isValidSize(compressed, maxSize)) return compressed;

        const ratio = maxSize / compressed.size;
        /**
         * Ratio will be < 1
         * Reduce quality by a larger amount if compressed.size is large (max 0.1)
         * Reduce quality by a smaller amount if compressed.size gets closer to maxSize (min 0.025)
         */
        const targetQuality = quality - Math.min(0.025 / ratio, 0.1);
        return compressImage(file, { ...options, quality: targetQuality });
    };
}

// =============================================================================
// HELPER FUNCTION
// =============================================================================
/**
 * Converts blob to HTMLImageElement
 * @param blob: image in blob
 * @returns HTMLImageElement converted from blob
 */
const blobToImage = async (blob: Blob): Promise<HTMLImageElement> => {
    const url = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () =>
            reject(new Error("blobToImage(): blob is illegal"));
        image.src = url;
    });
};
