import { setUpMinio } from "./s3-initializer" 

setUpMinio(
    process.argv[2],
    process.argv[3],
    process.argv[4]
    );