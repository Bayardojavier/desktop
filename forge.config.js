const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Absolute de Nicaragua',
    executableName: 'Absolute de Nicaragua',
    ignore: [
      /^\/src\/.*\.map$/,
      /^\/\.git$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Absolute_de_Nicaragua',
        exe: 'Absolute de Nicaragua.exe',
        setupExe: 'Absolute_de_Nicaragua_Setup.exe',
        setupIcon: 'assets/icon.ico',
        noMsi: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
      config: {
        name: 'Absolute_de_Nicaragua_Portable',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
