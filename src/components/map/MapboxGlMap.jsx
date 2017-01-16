import React from 'react'
import ReactDOM from 'react-dom'
import MapboxGl from 'mapbox-gl/dist/mapbox-gl.js'
import MapboxInspect from 'mapbox-gl-inspect'
import FeatureLayerPopup from './FeatureLayerPopup'
import FeaturePropertyPopup from './FeaturePropertyPopup'
import validateColor from 'mapbox-gl-style-spec/lib/validate/validate_color'
import style from '../../libs/style.js'
import tokens from '../../config/tokens.json'
import { colorHighlightedLayer } from '../../libs/highlight'
import 'mapbox-gl/dist/mapbox-gl.css'
import '../../mapboxgl.css'

function renderLayerPopup(features) {
  var mountNode = document.createElement('div');
  ReactDOM.render(<FeatureLayerPopup features={features} />, mountNode)
  return mountNode.innerHTML;
}

function renderPropertyPopup(features) {
  var mountNode = document.createElement('div');
  ReactDOM.render(<FeaturePropertyPopup features={features} />, mountNode)
  return mountNode.innerHTML;
}

function buildInspectStyle(originalMapStyle, coloredLayers, highlightedLayer) {
  const backgroundLayer = {
    "id": "background",
    "type": "background",
    "paint": {
      "background-color": '#1c1f24',
    }
  }

  const layer = colorHighlightedLayer(highlightedLayer)
  if(layer) {
    coloredLayers.push(layer)
  }

  const sources = {}
  Object.keys(originalMapStyle.sources).forEach(sourceId => {
    const source = originalMapStyle.sources[sourceId]
    if(source.type !== 'raster') {
      sources[sourceId] = source
    }
  })

  const inspectStyle = {
    ...originalMapStyle,
    sources: sources,
    layers: [backgroundLayer].concat(coloredLayers)
  }
  return inspectStyle
}

export default class MapboxGlMap extends React.Component {
  static propTypes = {
    onDataChange: React.PropTypes.func,
    mapStyle: React.PropTypes.object.isRequired,
    inspectModeEnabled: React.PropTypes.bool.isRequired,
    highlightedLayer: React.PropTypes.object,
  }

  static defaultProps = {
    onMapLoaded: () => {},
    onDataChange: () => {},
    mapboxAccessToken: tokens.mapbox,
  }

  constructor(props) {
    super(props)
    MapboxGl.accessToken = tokens.mapbox
    this.state = {
      map: null,
      inspect: null,
      isPopupOpen: false,
      popupX: 0,
      popupY: 0,
    }
  }

  componentWillReceiveProps(nextProps) {
    if(!this.state.map) return
    const metadata = nextProps.mapStyle.metadata || {}
    MapboxGl.accessToken = metadata['maputnik:mapbox_access_token'] || tokens.mapbox

    if(!nextProps.inspectModeEnabled) {
      //Mapbox GL now does diffing natively so we don't need to calculate
      //the necessary operations ourselves!
      this.state.map.setStyle(nextProps.mapStyle, { diff: true})
    }
  }

  componentDidUpdate(prevProps) {
    if(this.props.inspectModeEnabled !== prevProps.inspectModeEnabled) {
      this.state.inspect.toggleInspector()
    }
    if(this.props.inspectModeEnabled) {
      this.state.inspect.render()
    }
  }

  componentDidMount() {
    const map = new MapboxGl.Map({
      container: this.container,
      style: this.props.mapStyle,
      hash: true,
    })

    const nav = new MapboxGl.NavigationControl();
    map.addControl(nav, 'top-right');

    const inspect = new MapboxInspect({
      popup: new MapboxGl.Popup({
        closeButton: false,
        closeOnClick: false
      }),
      showMapPopup: true,
      showInspectButton: false,
      buildInspectStyle: (originalMapStyle, coloredLayers) => buildInspectStyle(originalMapStyle, coloredLayers, this.props.highlightedLayer),
      renderPopup: features => {
        if(this.props.inspectModeEnabled) {
          return renderPropertyPopup(features)
        } else {
          return renderLayerPopup(features)
        }
      }
    })
    map.addControl(inspect)

    map.on("style.load", () => {
      this.setState({ map, inspect });
    })

    map.on("data", e => {
      if(e.dataType !== 'tile') return
      this.props.onDataChange({
        map: this.state.map
      })
    })
  }

  render() {
    return <div
      className="maputnik-map"
      ref={x => this.container = x}
    ></div>
  }
}
