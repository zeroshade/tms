const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // publicPath: '/admin/',
  pages: {
    index: {
      entry: 'src/main.ts',
      template: 'public/index.html',
      filename: 'admin/index.html',
    },
    calendar: {
      entry: 'src/cal.ts',
      template: 'public/calendar.html',
      filename: 'calendar/index.html',
    }
  },
  configureWebpack: {
    plugins: [new HtmlWebpackPlugin({
      templateParameters: {
        BASE_URL: "/",
        MERCHANT_ID: process.env.VUE_APP_MERCHANT_ID,
      },
      title: 'Fishing Reports',
      template: 'public/fishing-reports.html',
      filename: 'fishing-reports.html',
      chunks: [],
    })]
  },
  pwa: {
    workboxOptions: {
      exclude: /\.htaccess$/,
    },
  }
}