@preconcurrency import JavaScriptCore
import Foundation
#if canImport(Darwin)
import Darwin
#endif

/// `node:os` implementation bridging to `ProcessInfo`.
enum NodeOS {
    static func install(in context: JSContext) {
        let info = ProcessInfo.processInfo

        let hostnameBlock: @convention(block) () -> String = {
            info.hostName
        }
        context.setObject(hostnameBlock, forKeyedSubscript: "__osHostname" as NSString)

        let homeDirBlock: @convention(block) () -> String = {
            NSHomeDirectory()
        }
        context.setObject(homeDirBlock, forKeyedSubscript: "__osHomedir" as NSString)

        let tmpDirBlock: @convention(block) () -> String = {
            NSTemporaryDirectory()
        }
        context.setObject(tmpDirBlock, forKeyedSubscript: "__osTmpdir" as NSString)

        let totalMemBlock: @convention(block) () -> Double = {
            Double(info.physicalMemory)
        }
        context.setObject(totalMemBlock, forKeyedSubscript: "__osTotalmem" as NSString)

        let cpuCountBlock: @convention(block) () -> Int = {
            info.processorCount
        }
        context.setObject(cpuCountBlock, forKeyedSubscript: "__osCpuCount" as NSString)

        context.evaluateScript("""
        (function() {
            var os = {
                hostname: function() { return __osHostname(); },
                homedir: function() { return __osHomedir(); },
                tmpdir: function() { return __osTmpdir(); },
                totalmem: function() { return __osTotalmem(); },
                freemem: function() { return __osTotalmem() * 0.5; },
                cpus: function() {
                    var count = __osCpuCount();
                    var result = [];
                    for (var i = 0; i < count; i++) {
                        result.push({ model: 'Apple Silicon', speed: 0, times: {} });
                    }
                    return result;
                },
                type: function() { return 'Darwin'; },
                platform: function() { return 'darwin'; },
                arch: function() { return 'arm64'; },
                release: function() { return '24.0.0'; },
                uptime: function() { return Math.floor(performance.now() / 1000); },
                loadavg: function() { return [0, 0, 0]; },
                networkInterfaces: function() { return {}; },
                userInfo: function() {
                    return {
                        username: 'mobile',
                        uid: 501,
                        gid: 20,
                        shell: '/bin/zsh',
                        homedir: __osHomedir(),
                    };
                },
                endianness: function() { return 'LE'; },
                EOL: '\\n',
                constants: {
                    signals: {},
                    errno: {},
                },
            };

            if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
            __nodeModules.os = os;
        })();
        """)
    }
}
