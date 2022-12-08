"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAKE_BUILD_SCRIPT = exports.RUN_COMMAND = exports.detectProjectType = void 0;
const fs_1 = __importDefault(require("fs"));
function detectProjectType(folder) {
    let files = fs_1.default.readdirSync(folder);
    if (files.includes(`dockerfile`))
        return "docker";
    if (files.includes(`package.json`))
        return "nodejs";
    if (files.includes(`tsconfig.json`))
        return "typescript";
    if (files.includes(`gradlew`) ||
        files.includes(`build.gradle`) ||
        files.includes(`settings.gradle`))
        return "gradle";
    if (files.includes(`pom.xml`))
        return "maven";
    if (files.includes(`requirements.txt`) ||
        files.includes(`setup.py`) ||
        files.includes(`Pipfile`))
        return "python";
    if (files.includes(`composer.json`) || files.includes(`index.php`))
        return "php";
    if (files.includes(`Gemfile`))
        return "ruby";
    if (files.includes(`go.mod`))
        return "go";
    if (files.includes(`*.stb`))
        return "scala";
    if (files.includes(`project.clj`))
        return "clojure";
    if (files.includes(`Cargo.toml`))
        return "rust";
    throw `Unknown project type in ${folder}`;
}
exports.detectProjectType = detectProjectType;
function nodeJsRunCommand(folder) {
    var _a;
    let pkg = JSON.parse("" + fs_1.default.readFileSync(`${folder}/package.json`));
    let cmd = ((_a = pkg.scripts) === null || _a === void 0 ? void 0 : _a.start) ||
        (fs_1.default.existsSync(`${folder}/server.js`) && `node server.js`) ||
        (fs_1.default.existsSync(`${folder}/app.js`) && `node app.js`) ||
        (pkg.main && `node ${pkg.main}`);
    if (cmd === undefined)
        throw `Missing scripts.start in: ${folder}/package.json`;
    return cmd;
}
function gradleRunCommand(folder) {
    let gradleProjectName = fs_1.default.readdirSync(`${folder}/build/install/`)[0];
    if (gradleProjectName === undefined)
        throw `Missing executable: ${folder}build/install/`;
    return `sh ./build/install/${gradleProjectName}/bin/${gradleProjectName}`;
}
function golangRunCommand(folder) {
    return `./app`;
}
exports.RUN_COMMAND = {
    docker: () => {
        throw "Custom dockerfiles are not supported";
    },
    nodejs: nodeJsRunCommand,
    typescript: nodeJsRunCommand,
    gradle: gradleRunCommand,
    maven: () => {
        throw "Maven support is coming soon";
    },
    python: () => {
        throw "Python support is coming soon";
    },
    php: () => {
        throw "Php support is coming soon";
    },
    scala: () => {
        throw "Scala support is coming soon";
    },
    clojure: () => {
        throw "Clojure support is coming soon";
    },
    ruby: () => {
        throw "Ruby support is coming soon";
    },
    rust: () => {
        throw "Rust support is coming soon";
    },
    go: golangRunCommand,
};
function generateNewFileName(folder) {
    let result;
    do {
        result = "f" + Math.random();
    } while (fs_1.default.existsSync(`${folder}/${result}`));
    return result;
}
function nodeJsBuild(typescript) {
    return (folder) => {
        var _a;
        let buildCommands = [];
        buildCommands.push("npm ci");
        if (typescript)
            buildCommands.push("tsc");
        let pkg = JSON.parse("" + fs_1.default.readFileSync(`${folder}/package.json`));
        let hasInstallScript = ((_a = pkg.scripts) === null || _a === void 0 ? void 0 : _a.install) !== undefined;
        if (hasInstallScript)
            buildCommands.push("npm run install");
        return buildCommands;
    };
}
function gradleBuild(folder) {
    let buildCommands = [];
    buildCommands.push(`./gradlew install`);
    return buildCommands;
}
function golangBuild(folder) {
    let buildCommands = [];
    buildCommands.push(`CGO_ENABLED=0 go build -o app -ldflags="-extldflags=-static"`);
    return buildCommands;
}
function common(ptBuilder) {
    return (folder) => {
        let cmds = ptBuilder(folder);
        let fileName = generateNewFileName(folder);
        fs_1.default.writeFileSync(`${folder}/${fileName}`, cmds.join("\n"));
        return fileName;
    };
}
exports.MAKE_BUILD_SCRIPT = {
    docker: () => {
        throw "Custom dockerfiles are not supported";
    },
    nodejs: common(nodeJsBuild(false)),
    typescript: common(nodeJsBuild(true)),
    gradle: common(gradleBuild),
    maven: () => {
        throw "Maven support is coming soon";
    },
    python: () => {
        throw "Python support is coming soon";
    },
    php: () => {
        throw "Php support is coming soon";
    },
    scala: () => {
        throw "Scala support is coming soon";
    },
    clojure: () => {
        throw "Clojure support is coming soon";
    },
    ruby: () => {
        throw "Ruby support is coming soon";
    },
    rust: () => {
        throw "Rust support is coming soon";
    },
    go: common(golangBuild),
};
