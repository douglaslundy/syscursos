import { readFileSync, writeFileSync } from "node:fs";
import { parseTranscript } from "./import-drive-courses";
writeFileSync(process.argv[3], JSON.stringify(parseTranscript(readFileSync(process.argv[2], "utf8"))));
