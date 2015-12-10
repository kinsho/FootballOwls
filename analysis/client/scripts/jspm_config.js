System.config({
  "baseURL": "client/scripts",
  "transpiler": "traceur",
  "paths": {
    "*": "*.js",
    "github:*": "client/scripts/jspm_packages/github/*.js"
  }
});

System.config({
  "map": {
    "traceur": "github:jmcriffey/bower-traceur@0.0.88",
    "traceur-runtime": "github:jmcriffey/bower-traceur-runtime@0.0.88"
  }
});

