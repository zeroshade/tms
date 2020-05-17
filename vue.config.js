const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  devServer: {
    host: '0.0.0.0',
    port: '8080',
  },
  publicPath: process.env.VUE_APP_BASE_PATH,
  transpileDependencies: [
    "vuetify",
    "tiptap-vuetify"
  ],
  chainWebpack: config => {
    config
      .plugin('html-calendar')
      .tap(args => {
        args[0].minify = false;
        return args;
      })
  },
  pages: {
    index: {
      entry: 'src/main.ts',
      template: 'public/index.html',
      filename: 'admin/index.html',
    },
    calendar: {
      entry: 'src/cal.ts',
      template: process.env.VUE_APP_CUSTOM_CALENDAR_TMPL
        ? `public/${process.env.VUE_APP_CUSTOM_CALENDAR_TMPL}`
        : 'public/calendar.html',
      filename: 'calendar/index.html',
    }
  },
  productionSourceMap: false,
  configureWebpack: {
    plugins: [new HtmlWebpackPlugin({
      templateParameters: {
        BASE_URL: process.env.VUE_APP_BASE_PATH,
        MERCHANT_ID: process.env.VUE_APP_MERCHANT_ID,
      },
      title: 'Fishing Reports',
      template: 'public/fishing-reports.html',
      filename: 'fishing-reports.html',
      chunks: [],
    }), new CompressionPlugin({
      test: /\.js(\?.*)?$/i,
    })]
  },
  pwa: {
    serviceWorker: false,
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      cleanupOutdatedCaches: true,
      exclude: [/\.htaccess$/, 'fishing-reports.html', 'calendar/index.html']
    },
  }
}
