module.exports = {
  pages: {
    index: {
      entry: 'src/main.ts',
      template: 'public/index.html',
      filename: 'index.html',
    },
    calendar: {
      entry: 'src/cal.ts',
      template: 'public/index.html',
      filename: 'calendar/index.html',
    }
  }
}