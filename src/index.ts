import { FileHelper } from "./file-helper";

/**
 * Function to compress the file. The function will
 * 1. Attempt to resample the file up to 90% of the quality
 * 2. Recursively reduce the quality until a scale of 0.1
 * 3. If that fails, an error will be thrown
 *
 * @param file the file to be compressed
 * @param maxSize the size of the file in bytes
 */
export async function compress(file: File, maxSize: number) {
    const nonCompressableFileTypes = ["application/pdf"];

    try {
        const validDocSize = FileHelper.isValidSize(file, maxSize);
        if (!validDocSize && nonCompressableFileTypes.includes(file.type)) {
            // Won't compress, throw error
            throw new Error("Unable to compress file");
        }

        /**
         * Attempt to compress by going through the following
         * 1. Scale down to 90%
         * 2. Recursively drop quality till 0.1
         * 3. If all else fails, show an error message
         */
        let compressedDocument = await FileHelper.resampleImage(file, {
            scale: 0.9,
        });
        if (!FileHelper.isValidSize(compressedDocument, maxSize)) {
            compressedDocument = await FileHelper.compressImage(
                compressedDocument,
                {
                    maxSize,
                }
            );
        }

        return compressedDocument;
    } catch (error) {
        throw new Error("Unable to compress file due to error:", error);
    }
}
