import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
    testDir: './tests',
    webServer: {
        command: 'npm run start -- --host 127.0.0.1 --port 4173 --strictPort',
        url: baseURL
    },
    use: {
        baseURL,
        viewport: { width: 1280, height: 720 },
        video: process.env.KM77_RECORD === '1' ? 'on' : 'off'
    },
    projects: [
        {
            name: 'chrome',
            use: {
                channel: 'chrome',
                launchOptions: {
                    args:
                        process.env.KM77_HARDWARE === '1'
                            ? ['--use-gl=angle', '--use-angle=vulkan']
                            : ['--enable-unsafe-swiftshader']
                }
            }
        },
        ...(process.env.KM77_TEST_FIREFOX === '1'
            ? [
                  {
                      name: 'firefox',
                      use: {
                          browserName: 'firefox' as const,
                          launchOptions: {
                              firefoxUserPrefs: {
                                  'webgl.force-enabled': true
                              }
                          }
                      }
                  }
              ]
            : [])
    ]
});
