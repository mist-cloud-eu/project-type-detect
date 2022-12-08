import fs from "fs";
export type ProjectType =
  | "docker"
  | "nodejs"
  | "typescript"
  | "gradle"
  | "maven"
  | "python"
  | "php"
  | "ruby"
  | "go"
  | "scala"
  | "clojure"
  | "rust";
export function detectProjectType(folder: string): ProjectType {
  let files = fs.readdirSync(folder);
  if (files.includes(`dockerfile`)) return "docker";
  if (files.includes(`package.json`)) return "nodejs";
  if (files.includes(`tsconfig.json`)) return "typescript";
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
  if (files.includes(`*.stb`)) return "scala";
  if (files.includes(`project.clj`)) return "clojure";
  if (files.includes(`Cargo.toml`)) return "rust";
  throw `Unknown project type in ${folder}`;
}

function nodeJsRunCommand(folder: string) {
  let pkg: { main?: string; scripts?: { start?: string } } = JSON.parse(
    "" + fs.readFileSync(`${folder}/package.json`)
  );
  let cmd =
    pkg.scripts?.start ||
    (fs.existsSync(`${folder}/server.js`) && `node server.js`) ||
    (fs.existsSync(`${folder}/app.js`) && `node app.js`) ||
    (pkg.main && `node ${pkg.main}`);
  if (cmd === undefined)
    throw `Missing scripts.start in: ${folder}/package.json`;
  return cmd;
}

function gradleRunCommand(folder: string) {
  let gradleProjectName = fs.readdirSync(`${folder}/build/install/`)[0];
  if (gradleProjectName === undefined)
    throw `Missing executable: ${folder}build/install/`;
  return `sh ./build/install/${gradleProjectName}/bin/${gradleProjectName}`;
}

function golangRunCommand(folder: string) {
  return `./app`;
}

export const RUN_COMMAND: {
  [projectType in ProjectType]: (folder: string) => string;
} = {
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

function generateNewFileName(folder: string) {
  let result: string;
  do {
    result = "f" + Math.random();
  } while (fs.existsSync(`${folder}/${result}`));
  return result;
}

function nodeJsBuild(typescript: boolean) {
  return (folder: string) => {
    let buildCommands: string[] = [];
    buildCommands.push("npm ci");
    if (typescript) buildCommands.push("tsc");
    let pkg: { scripts?: { install?: string } } = JSON.parse(
      "" + fs.readFileSync(`${folder}/package.json`)
    );
    let hasInstallScript = pkg.scripts?.install !== undefined;
    if (hasInstallScript) buildCommands.push("npm run install");
    return buildCommands;
  };
}

function gradleBuild(folder: string) {
  let buildCommands: string[] = [];
  buildCommands.push(`./gradlew install`);
  return buildCommands;
}

function golangBuild(folder: string) {
  let buildCommands: string[] = [];
  buildCommands.push(
    `CGO_ENABLED=0 go build -o app -ldflags="-extldflags=-static"`
  );
  return buildCommands;
}

function common(ptBuilder: (folder: string) => string[]) {
  return (folder: string) => {
    let cmds = ptBuilder(folder);
    let fileName = generateNewFileName(folder);
    fs.writeFileSync(`${folder}/${fileName}`, cmds.join("\n"));
    return fileName;
  };
}

export const MAKE_BUILD_SCRIPT: {
  [projectType in ProjectType]: (folder: string) => string;
} = {
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
