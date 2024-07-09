/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 458:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(94);
const { stderr } = __nccwpck_require__(282);
const { promisify } = __nccwpck_require__(837);

console.log('start');
const promiss = promisify((__nccwpck_require__(81).exec))
const exec = async cmd => {
    const res = await promiss(cmd);
    console.log(res.stdout);
    console.log(res.stderr);
    return res;
}

const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

let loginToHeroku = async function loginToHeroku(login, password) {
    try {
        await exec(`cat >>~/.netrc <<EOF
        machine api.heroku.com
            login ${login}
            password ${password}
        EOF
        `);

        console.log('.netrc file create ✅');

        await exec(`echo ${password} | docker login --username=${login} registry.heroku.com --password-stdin`);

        console.log('Logged in succefully ✅');
    }
    catch (error) {
        core.setFailed(`Authentication process faild. Error: ${error.message}`);
    }
}

let getImageAppNameList = async function getImageAppNameList(heroku_apps) {
    try {
        return JSON.parse(heroku_apps);
    }
    catch (error) {
        core.setFailed(`Invalid input for heroku app. Error: ${error.message}`);
    }
}

let appendHerokuEnvirons = async imageList => {
    try {
        if (imageList.length > 0) {
            await asyncForEach(imageList, async item => {
                const res = await exec(`heroku config --app ${item.appname} --json`)
                console.log(res.stdout);
                Object.entries(JSON.parse(res.stdout)).forEach(([k, v]) => {
                    process.env[k] = v;
                });
            });
        }
    }
    catch (error) {
        core.setFailed(`Somthing went wrong setting Environs. Error: ${error.message}`)
    }
}

let buildDockerCompose = async function buildDockerCompose(dockerComposeFilePath) {
    try {
        console.log('docker image pull started.');
        await exec(`docker-compose -f ${dockerComposeFilePath} pull`);
        console.log('docker image pull finished');
        console.log('docker image build started.');
        await exec(`docker-compose -f ${dockerComposeFilePath} build`);
        console.log('docker image build finished.');
        const res = await exec(`docker ps -a`)
        console.log(res.stdout)
    }
    catch (error) {
        core.setFailed(`Somthing went wrong building your image. Error: ${error.message}`);
    }
}

let pushAndDeployAllImages = async function pushAndDeployAllImages(imageList) {
    try {
        if (imageList.length > 0) {
            await asyncForEach(imageList, async (item) => {
                console.log('Processing image -' + item.imagename);
                await exec(`docker tag ${item.imagename} registry.heroku.com/${item.appname}/${item.apptype}`);
                console.log('Container tagged for image - ' + item.imagename);
                await exec(`docker push registry.heroku.com/${item.appname}/${item.apptype}`);
                console.log('Container pushed for image - ' + item.imagename);
                await exec(`heroku container:release ${item.apptype} --app ${item.appname}`);
                console.log('Container deployed for image - ' + item.imagename);
            });
            console.log('App Deployed successfully ✅');
        } else {
            core.setFailed(`No image given to process.`);
        }
    }
    catch (error) {
        core.setFailed(`Somthing went wrong while pushing and deploying your image. Error: ${error.message}`);
    }
}

let buildAndDeploy = async function buildAndDeploy(login, password, dockerComposeFilePath, imageListString)
{
        await loginToHeroku(login, password);
        const imageList = await getImageAppNameList(imageListString);
        await appendHerokuEnvirons(imageList);
        await buildDockerCompose(dockerComposeFilePath);
        await pushAndDeployAllImages(imageList);
}

module.exports.loginToHeroku = loginToHeroku;
module.exports.getImageAppNameList = getImageAppNameList;
module.exports.appendHerokuEnvirons = appendHerokuEnvirons;
module.exports.buildDockerCompose = buildDockerCompose;
module.exports.pushAndDeployAllImages = pushAndDeployAllImages;
module.exports.buildAndDeploy = buildAndDeploy;


/***/ }),

/***/ 94:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 81:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 282:
/***/ ((module) => {

"use strict";
module.exports = require("process");

/***/ }),

/***/ 837:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(94);
const app = __nccwpck_require__(458);

async function run() {
    try {
        const login = core.getInput('email');
        const password = core.getInput('api_key');
        const imageListString = core.getInput('heroku_apps');
        const dockerComposeFilePath = core.getInput('docker_compose_file');

        await app.buildAndDeploy(login, password, dockerComposeFilePath, imageListString);
    }
    catch (error) {
        console.log({ message: error.message });
        core.setFailed(error.message);
    }
}

run()
})();

module.exports = __webpack_exports__;
/******/ })()
;