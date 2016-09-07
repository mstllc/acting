const chokidar = require('chokidar')
const path = require('path')
const fs = require('fs')

class ActingScene {
  constructor (scenePath) {
    this._scenePath = scenePath
  }

  newFile (handler) {
    this._onFileAdd = handler
    return this
  }

  newFolder (handler) {
    this._onDirectoryAdd = handler
    return this
  }

  changedFile (handler) {
    this._onFileChange = handler
    return this
  }

  removedFile (handler) {
    this._onFileRemove = handler
    return this
  }

  removedFolder (handler) {
    this._onDirectoryRemove = handler
    return this
  }

  handle (eventType, eventPath) {
    if (typeof this[eventType] === 'function') {
      this[eventType](path.basename(eventPath), eventPath, this._scenePath, this)
    }
  }
}

class ActingClass {
  constructor () {
    this.watchScript = false
    this._scenes = {}
  }

  scene (scenePath) {
    const scene = (this._scenes[scenePath]) ? this._scenes[scenePath] : new ActingScene(scenePath)
    this._scenes[scenePath] = scene
    return scene
  }

  lights () {
    // Require config
    this._cwd = process.cwd()
    this._scriptPath = path.join(this._cwd, 'acting-script.js')

    try {
      const scriptStat = fs.statSync(this._scriptPath)
      if (!scriptStat.isFile()) {
        console.log(`Cant find file 'acting-script.js' in current working directory`)
        process.exit(1)
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.log(`Cant find file 'acting-script.js' in current working directory`)
      } else {
        console.log(e)
      }
      process.exit(1)
    }

    try {
      require(this._scriptPath)
    } catch (e) {
      console.log(e)
    }

    return this
  }

  camera () {
    // Setup watcher and add scenes
    this._camera = chokidar.watch([], {
      followSymlinks: false,
      useFsEvents: false,
      depth: 0,
      ignored: ['**/.DS_Store'],
      ignoreInitial: true
    })

    this._camera.on('add', this._onFileAdd.bind(this))
    this._camera.on('addDir', this._onDirectoryAdd.bind(this))
    this._camera.on('change', this._onFileChange.bind(this))
    this._camera.on('unlink', this._onFileRemove.bind(this))
    this._camera.on('unlinkDir', this._onDirectoryRemove.bind(this))

    return this
  }

  action () {
    // Start watching
    this._camera.add(Object.keys(this._scenes))
  }

  _onFileAdd (filePath) {
    const scene = this._scenes[path.dirname(filePath)]
    scene.handle('_onFileAdd', filePath)
  }

  _onDirectoryAdd (directoryPath) {
    const scene = this._scenes[path.dirname(directoryPath)]
    scene.handle('_onDirectoryAdd', directoryPath)
  }

  _onFileChange (filePath) {
    const scene = this._scenes[path.dirname(filePath)]
    scene.handle('_onFileChange', filePath)
  }

  _onFileRemove (filePath) {
    const scene = this._scenes[path.dirname(filePath)]
    scene.handle('_onFileRemove', filePath)
  }

  _onDirectoryRemove (directoryPath) {
    const scene = this._scenes[path.dirname(directoryPath)]
    scene.handle('_onDirectoryRemove', directoryPath)
  }
}

const acting = new ActingClass()
module.exports = acting
