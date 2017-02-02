import request from 'request'

function loadJSON(url, defaultValue, cb) {
  request({
    url: url,
    withCredentials: false,
  }, (error, response, body) => {
    if (!error && body && response.statusCode == 200) {
      try {
        cb(JSON.parse(body))
      } catch(err) {
        console.error(err)
        cb(defaultValue)
      }
    } else {
      console.warn('Can not metadata for ' + url)
      cb(defaultValue)
    }
  })
}

export function downloadGlyphsMetadata(urlTemplate, cb) {
  if(!urlTemplate) return cb([])

  // Special handling because Tileserver GL serves the fontstacks metadata differently
  // https://github.com/klokantech/tileserver-gl/pull/104
  let url = urlTemplate.replace('/fonts/{fontstack}/{range}.pbf', '/fontstacks.json')
  url = url.replace('{fontstack}/{range}.pbf', 'fontstacks.json')

  loadJSON(url, [], cb)
}

export function downloadSpriteMetadata(baseUrl, cb) {
  if(!baseUrl) return cb([])
  const url = baseUrl + '.json'
  loadJSON(url, {}, glyphs => cb(Object.keys(glyphs)))
}
