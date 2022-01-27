import logger from "../src/util/logger";
var Minio = require("minio");
const Fs = require('fs')

export const setUpMinio = (endPoint,accessKey,secretKey) =>
{
  createIfBucketDoesentExsist("document-forms",endPoint,accessKey,secretKey);
  createIfBucketDoesentExsist("templates",endPoint,accessKey,secretKey).then(() =>
  {
    getFilesAndUpload(`assets/templates/`,uploadToMinio,endPoint,accessKey,secretKey)
  });
}

const createIfBucketDoesentExsist = async (bucketName,endPoint,accessKey,secretKey) => {
  return new Promise((resolve, reject) => {
    const s3Client = new Minio.Client({
      endPoint: endPoint,
      port: 9000,
      useSSL: false,
      accessKey:accessKey,
      secretKey: secretKey,
    });
    try{
        s3Client.bucketExists(bucketName).then((exsistRes) => {
        if(exsistRes)
        {
          logger.info(`Bucket - ${bucketName} exsists.`);
          resolve(`Bucket - ${bucketName} exsists.`)
        }
        else{
          let policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicRead",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion"
                    ],
                    "Resource": [
                        `arn:aws:s3:::${bucketName}/*`
                    ]
                }
            ]
          }
          s3Client.makeBucket(bucketName, "ap-southeast-1").then(() => {
            s3Client.setBucketPolicy(bucketName,JSON.stringify(policy)).then(() =>
              {
                logger.info(`Bucket ${bucketName} created successfully in "ap-southeast-1".`),
                resolve(`Bucket ${bucketName} created successfully in "ap-southeast-1".`)
              });
          });

  }
      });
    }
    catch(err)
    {
      logger.error(`an error has occoured durring minio set up - ${err}`);
      reject(`an error has occoured durring minio set up - ${err}`) 
    }
  });
  }

  const getFilesAndUpload = (filesPath,upload,endPoint,accessKey,secretKey) =>
  {
    return Fs.readdir(`assets/templates/`, (err, files) => {
      files.forEach(file => {
        upload("templates",file,filesPath,endPoint,accessKey,secretKey)
        console.log(file);
      });
    });
  }

  const uploadToMinio = async (bucketName,fileName,path,endPoint,accessKey,secretKey) =>
  {
    const s3Client = new Minio.Client({
      endPoint: endPoint,
      port: 9000,
      useSSL: false,
      accessKey:accessKey,
      secretKey: secretKey,
    });
try
{
  var file = path+fileName;
  var fileStream = Fs.createReadStream(file)
  var fileStat = Fs.stat(file, function(err, stats) {
    if (err) {
      return logger.error(err)
    }
    s3Client.putObject(bucketName, fileName, fileStream, stats.size, function(err, objInfo) {
      if(err) {
        return logger.error(err)
      }
      logger.info(`Successfully uploaded ${fileName} template to ${bucketName}`);
    })
  })
}
catch(err)
  {
    logger.error(err)
  }
};
  