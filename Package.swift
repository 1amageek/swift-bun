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
    ],
    targets: [
        .target(
            name: "BunRuntime",
            dependencies: [
                .product(name: "NIOCore", package: "swift-nio"),
                .product(name: "NIOPosix", package: "swift-nio"),
            ],
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
