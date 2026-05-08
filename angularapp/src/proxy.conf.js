const PROXY_CONFIG = [
  {
    context: [
      "/weatherforecast",
    ],
    target: "https://localhost:7155",
    secure: false
  }
]

module.exports = PROXY_CONFIG;
