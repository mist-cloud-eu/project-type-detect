"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeBuildScript =
  exports.BUILD_SCRIPT_MAKERS =
  exports.RUN_COMMAND =
  exports.detectProjectType =
    void 0;
const fs_1 = __importDefault(require("fs"));
function detectProjectType(folder) {
  let files = fs_1.default.readdirSync(folder);
  if (files.includes(`dockerfile`)) return "docker";
  if (files.includes(`tsconfig.json`)) return "typescript";
  if (files.includes(`package.json`)) return "nodejs";
  if (
    files.includes(`gradlew`) ||
    files.includes(`build.gradle`) ||
    files.includes(`settings.gradle`)
  )
    return "gradle";
  if (files.includes(`pom.xml`)) return "maven";
  if (
    files.includes(`requirements.txt`) ||
    files.includes(`setup.py`) ||
    files.includes(`Pipfile`)
  )
    return "python";
  if (files.includes(`composer.json`) || files.includes(`index.php`))
    return "php";
  if (files.includes(`Gemfile`)) return "ruby";
  if (files.includes(`go.mod`)) return "go";
  if (files.includes(`project.clj`)) return "clojure";
  if (files.includes(`Cargo.toml`)) return "rust";
  if (files.some((x) => x.endsWith(`.csproj`))) return "csharp";
  // if (files.includes(`*.stb`)) return "scala";
  throw `Unknown project type in ${folder}`;
}
exports.detectProjectType = detectProjectType;
function nodeJsRunCommand(folder) {
  var _a;
  let pkg = JSON.parse(
    "" + fs_1.default.readFileSync(`${folder}/package.json`)
  );
  let cmd =
    ((_a = pkg.scripts) === null || _a === void 0 ? void 0 : _a.start) ||
    (fs_1.default.existsSync(`${folder}/server.js`) && `node server.js`) ||
    (fs_1.default.existsSync(`${folder}/app.js`) && `node app.js`) ||
    (pkg.main && `node ${pkg.main}`);
  if (cmd === undefined)
    throw `Missing scripts.start in: ${folder}/package.json`;
  return cmd;
}
function gradleRunCommand(folder) {
  let installDir;
  if (fs_1.default.existsSync(`${folder}/build/install`))
    installDir = `/build/install`;
  else if (fs_1.default.existsSync(`${folder}/app/build/install`))
    installDir = `/app/build/install`;
  else throw `Could not locate build/install folder`;
  let gradleProjectName = fs_1.default.readdirSync(folder + installDir)[0];
  if (gradleProjectName === undefined)
    throw `Missing executable: ${folder}${installDir}`;
  return `.${installDir}/${gradleProjectName}/bin/${gradleProjectName}`;
}
function golangRunCommand(folder) {
  return `./app`;
}
function csharpRunCommand(folder) {
  let Debug_or_Release = fs_1.default.readdirSync(`${folder}/bin`)[0];
  let arch = fs_1.default.readdirSync(`${folder}/bin/${Debug_or_Release}`)[0];
  let executable = fs_1.default
    .readdirSync(`${folder}/bin/${Debug_or_Release}/${arch}`)
    .find((x) => !x.includes(".") || x.endsWith(".exe"));
  return `./bin/${Debug_or_Release}/${arch}/${executable}`;
}
function rustRunCommand(folder) {
  if (fs_1.default.existsSync(`${folder}/target/release/app`))
    return `./target/release/app`;
  if (fs_1.default.existsSync(`${folder}/target/release/app.exe`))
    return `./target/release/app.exe`;
  throw `Missing executable: /target/release/app`;
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
  csharp: csharpRunCommand,
  rust: rustRunCommand,
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
    buildCommands.push(
      "NPM_CONFIG_UPDATE_NOTIFIER=false npm_config_loglevel=error npm ci"
    );
    if (typescript) buildCommands.push("tsc");
    let pkg = JSON.parse(
      "" + fs_1.default.readFileSync(`${folder}/package.json`)
    );
    let hasInstallScript =
      ((_a = pkg.scripts) === null || _a === void 0 ? void 0 : _a.install) !==
      undefined;
    if (hasInstallScript)
      buildCommands.push(
        "NPM_CONFIG_UPDATE_NOTIFIER=false npm_config_loglevel=error npm run install"
      );
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
  buildCommands.push(
    `CGO_ENABLED=0 go build -o app -ldflags="-extldflags=-static"`
  );
  return buildCommands;
}
function rustBuild(folder) {
  let buildCommands = [];
  buildCommands.push(`cargo build --release`);
  return buildCommands;
}
function csharpBuild(folder) {
  let buildCommands = [];
  buildCommands.push(
    `dotnet build --nologo -v q --property WarningLevel=0 /clp:ErrorsOnly`
  );
  return buildCommands;
}
exports.BUILD_SCRIPT_MAKERS = {
  docker: () => {
    throw "Custom dockerfiles are not supported";
  },
  nodejs: nodeJsBuild(false),
  typescript: nodeJsBuild(true),
  gradle: gradleBuild,
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
  csharp: csharpBuild,
  rust: rustBuild,
  go: golangBuild,
};
function writeBuildScript(ptBuilder) {
  return (folder) => {
    let cmds = ptBuilder(folder);
    let fileName = generateNewFileName(folder);
    fs_1.default.writeFileSync(`${folder}/${fileName}`, cmds.join("\n"));
    return fileName;
  };
}
exports.writeBuildScript = writeBuildScript;
