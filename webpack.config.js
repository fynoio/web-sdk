const path = require("path");

module.exports = (env) => {
    let library_info = { type: env.module_type };
    if (env.module_type === "window") {
        library_info.name = "fyno";
    }
    return {
        entry: path.resolve(__dirname, "src/index.js"),
        mode: "development",
        output: {
            filename: env.filename,
            path: path.resolve(__dirname, "dist"),
            library: library_info,
            environment: {
                arrowFunction: true,
            },
        },
        module: {
            rules: [
                {
                    test: /\.(js)$/,
                    exclude: /node_modules/,
                    use: "babel-loader",
                },
            ],
        },
    };
};
