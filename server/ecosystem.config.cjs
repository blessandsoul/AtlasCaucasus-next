module.exports = {
    apps: [
        {
            name: "tourism-server",
            script: "./dist/server.js",
            instances: "max", // Use all available CPU cores
            exec_mode: "cluster",
            env: {
                NODE_ENV: "production",
            },
            env_development: {
                NODE_ENV: "development",
            },

            // Logging
            error_file: "./logs/err.log",
            out_file: "./logs/out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true,

            // Process management
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",

            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,

            // Restart policy
            exp_backoff_restart_delay: 100,
            max_restarts: 10,
            min_uptime: "10s",

            // Source maps for better error traces
            source_map_support: true,
        },
    ],
};
