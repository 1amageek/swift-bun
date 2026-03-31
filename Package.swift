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
        .target(name: "BunRuntime"),
        .testTarget(
            name: "BunRuntimeTests",
            dependencies: ["BunRuntime"],
            resources: [
                .copy("claude.bundle.js"),
            ]
        ),
    ],
    swiftLanguageModes: [.v6]
)
