import Foundation

enum PackageFixtureSupport {
    static func makeProject(
        packages: [String],
        files: [String: String] = [:]
    ) throws -> URL {
        let projectURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("swift-bun-packages-\(UUID().uuidString)", isDirectory: true)
        let nodeModulesURL = projectURL.appendingPathComponent("node_modules", isDirectory: true)
        try FileManager.default.createDirectory(
            at: nodeModulesURL,
            withIntermediateDirectories: true,
            attributes: nil
        )

        for package in packages {
            let sourceURL = fixturePackageURL(named: package)
            let destinationURL = nodeModulesURL.appendingPathComponent(package, isDirectory: true)
            try FileManager.default.createDirectory(
                at: destinationURL.deletingLastPathComponent(),
                withIntermediateDirectories: true,
                attributes: nil
            )
            try FileManager.default.copyItem(at: sourceURL, to: destinationURL)
        }

        for (relativePath, contents) in files {
            let fileURL = projectURL.appendingPathComponent(relativePath)
            try FileManager.default.createDirectory(
                at: fileURL.deletingLastPathComponent(),
                withIntermediateDirectories: true,
                attributes: nil
            )
            try contents.write(to: fileURL, atomically: true, encoding: .utf8)
        }

        return projectURL
    }

    static func removeProject(_ projectURL: URL) {
        do {
            try FileManager.default.removeItem(at: projectURL)
        } catch {
        }
    }

    private static func fixturePackageURL(named name: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .appendingPathComponent("Fixtures", isDirectory: true)
            .appendingPathComponent("packages", isDirectory: true)
            .appendingPathComponent(name, isDirectory: true)
    }
}
