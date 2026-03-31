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
    targets: [
        .target(
            name: "BunRuntime",
            resources: [
                .copy("Resources/esm-transformer.bundle.js"),
            ]
        ),
        .testTarget(
            name: "BunRuntimeTests",
            dependencies: ["BunRuntime"],
            resources: [
                .copy("claude.bundle.js"),
                .copy("esm-transformer.bundle.js"),
                .copy("bun-test.bundle.js"),
            ]
        ),
    ],
    swiftLanguageModes: [.v6]
)
