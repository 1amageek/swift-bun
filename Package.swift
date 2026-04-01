// swift-tools-version: 6.3

import PackageDescription

let package = Package(
    name: "swift-bun",
    platforms: [
        .iOS("26.0"),
        .macOS("26.0"),
    ],
    products: [
        .library(name: "BunRuntime", targets: ["BunRuntime"]),
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-nio.git", from: "2.97.0"),
        .package(url: "https://github.com/1amageek/swift-testing-heartbeat.git", from: "0.1.0"),
    ],
    targets: [
        .target(
            name: "BunRuntime",
            dependencies: [
                .product(name: "NIOCore", package: "swift-nio"),
                .product(name: "NIOPosix", package: "swift-nio"),
            ],
            resources: [
                .copy("Resources/JavaScript"),
                .copy("Resources/esm-transformer.bundle.js"),
                .copy("Resources/polyfills.bundle.js"),
            ]
        ),
        .testTarget(
            name: "BunRuntimeTests",
            dependencies: [
                "BunRuntime",
                .product(name: "NIOCore", package: "swift-nio"),
                .product(name: "NIOPosix", package: "swift-nio"),
                .product(name: "NIOHTTP1", package: "swift-nio"),
                .product(name: "TestHeartbeat", package: "swift-testing-heartbeat"),
            ],
            resources: [
                .copy("claude.bundle.js"),
                .copy("esm-transformer.bundle.js"),
                .copy("bun-test.bundle.js"),
                .copy("polyfills.bundle.js"),
                .copy("echo-delay.js"),
                .copy("test-nexttick-only.js"),
                .copy("test-settimeout-await.js"),
                .copy("test-fetch-await.js"),
                .copy("test-nexttick-await.js"),
                .copy("test-all-modules.js"),
            ]
        ),
    ],
    swiftLanguageModes: [.v6]
)
