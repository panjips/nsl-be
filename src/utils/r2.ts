import { injectable } from "inversify";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { config } from "config";

@injectable()
export class R2Service {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.s3Client = new S3Client({
            region: "auto",
            endpoint: config.r2.endpoint,
            credentials: {
                accessKeyId: config.r2.accessKeyId,
                secretAccessKey: config.r2.secretAccessKey,
            },
        });

        this.bucketName = config.r2.bucket;
    }

    async uploadFile(fileName: string, fileBuffer: Buffer, contentType: string) {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType,
        });

        await this.s3Client.send(command);

        return `${config.r2.endpoint}/${fileName}`;
    }

    async deleteFile(fileName: string) {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
        });

        await this.s3Client.send(command);
    }
}
