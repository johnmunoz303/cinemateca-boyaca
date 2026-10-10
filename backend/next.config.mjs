import path from "node:path";
export default {outputFileTracingRoot:path.resolve(".."),poweredByHeader:false,output:process.platform==='win32'?undefined:'standalone',distDir:process.env.NEXT_BUILD_DIR??'.next'};
