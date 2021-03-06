// libraries
import React, { Component, PropTypes } from 'react'
import { ResponsiveContainer, ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts'
import moment from 'moment'

// utils
import Dimensions from 'react-dimensions'

// components
import CustomTooltip from './tooltip'

// logic

export const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']

function sharedStart (array) {
  let A = array.concat().sort()
  let a1 = A[0]
  let a2 = A[A.length - 1]
  let L = a1.length
  let i = 0
  while (i < L && a1.charAt(i) === a2.charAt(i)) { i++ }
  return a1.substring(0, i)
}

@Dimensions({ elementResize: true })
export default class Graph extends Component {
  static propTypes = {
    graph: PropTypes.object,
    graphKeys: PropTypes.array,
    graphData: PropTypes.array
  }

  constructor (props) {
    super(props)
    this.state = {
      visibility: {}
    }
  }

  handleClick = (o) => {
    const { dataKey } = o
    const { visibility } = this.state

    const key = dataKey.replace(/__hidden$/, '')

    this.setState({
      visibility: { ...visibility, [key]: typeof visibility[key] === 'undefined' ? false : !visibility[key] }
    })
  }

  timeFormatter (time) {
    return moment(time).format('MMM DD')
  }

  yearFormatter (time) {
    return moment(time).format('YYYY')
  }

  quarterFormatter (time) {
    return 'Q' + moment(time).format('Q YYYY')
  }

  shortQuarterFormatter (time) {
    return 'Q' + moment(time).format('Q\'YY')
  }

  monthFormatter (time) {
    return moment(time).format(moment(time).month() === 0 ? 'YYYY' : 'MMMM')
  }

  shortMonthFormatter (time) {
    return moment(time).format(moment(time).month() === 0 ? 'YYYY' : 'MMM')
  }

  getTicks () {
    // const { data, timeGroup } = this.props
    const { graphData: data, graph: { timeGroup } } = this.props

    let ticks = []

    if (data.length === 0) {
      return ticks
    }

    const timeStart = data[0].time
    const timeEnd = data[data.length - 1].time

    const day = 86000 * 1000

    let unit = 'month'

    if (timeGroup === 'month' || timeGroup === 'year' || timeGroup === 'quarter') {
      unit = timeGroup
    } else if (timeEnd - timeStart < 32 * day && timeGroup !== 'week') {
      unit = 'day'
    } else if (timeEnd - timeStart < 365 * day) {
      unit = 'week'
    }

    let time = moment(timeStart).startOf(unit)
    if (time >= timeStart) {
      ticks.push(time.valueOf())
    }
    while (time < timeEnd) {
      time = time.add(1, unit)
      if (time <= timeEnd) {
        ticks.push(time.valueOf())
      }
    }

    const tickFormatter = unit === 'year' ? this.yearFormatter
                        : unit === 'quarter' ? (ticks.length > 5 ? this.shortQuarterFormatter : this.quarterFormatter)
                        : unit === 'month' ? (ticks.length > 13 ? this.shortMonthFormatter : this.monthFormatter)
                                           : this.timeFormatter

    return { ticks, tickFormatter }
  }

  getKeysWithMeta () {
    const { graphKeys } = this.props
    const { visibility } = this.state

    let i = 0

    let nameSubString = graphKeys.length === 1 ? graphKeys[0].split('.')[0].length + 1 : sharedStart(graphKeys).length

    return graphKeys.filter(v => v).map(v => {
      const visible = typeof visibility[v] === 'undefined' || visibility[v]
      const object = {
        key: v,
        name: v.substring(nameSubString).split(/[_!$]/).join(' ') || 'empty',
        visible: visible,
        color: visible ? colors[i] : 'white'
      }
      i += 1
      return object
    })
  }

  getLineData = (key, stacked) => {
    // const { labels, percentages } = this.props
    const labels = false
    const percentages = false

    let data = {
      key: `${key.key}${percentages ? '__%' : ''}${key.visible ? '' : '__hidden'}`,
      type: 'linear',
      dataKey: `${key.key}${percentages ? '__%' : ''}${key.visible ? '' : '__hidden'}`,
      name: key.name,
      stroke: key.color,
      fill: key.color,
      strokeWidth: 1,
      legendType: 'circle',
      label: labels ? this.renderLabel : false,
      dot: {r: 2, fill: key.color, fillOpacity: 0.5},
      activeDot: {r: 6},
      isAnimationActive: false,
      stackId: stacked ? (key.key.indexOf('$$') > 0 ? key.key.split('$$')[0] : '1') : key.key
    }

    return data
  }

  renderLabel = (props) => {
    // const { percentages } = this.props
    const percentages = false

    const { x, y, stroke, value, key } = props
    const displayValue = Array.isArray(value) ? Math.round(value[1] - value[0]) : Math.round(parseFloat(value))

    if (percentages && displayValue === 100) {
      return null
    }

    return (
      <g key={key}>
        <text x={x}
              y={y}
              dy={-5}
              fill={'#fff'}
              stroke={'#fff'}
              strokeWidth={3}
              strokeOpacity={0.9}
              fontSize={10}
              textAnchor='middle'>
          {displayValue}{percentages ? '%' : ''}
        </text>
        <text x={x}
              y={y}
              dy={-5}
              fill={stroke}
              fontSize={10}
              textAnchor='middle'>
          {displayValue}{percentages ? '%' : ''}
        </text>
      </g>
    )
  }

  render () {
    // const { data, labels, summed, percentages, height, nullLineNeeded, meta: { unit, facets } } = this.props
    const { graph, graphData, containerHeight } = this.props
    const labels = false
    const percentages = false
    const nullLineNeeded = false
    const unit = ''
    const facets = graph.facets && graph.facets.length > 0
    const summed = facets
    const { timeGroup } = graph

    const keysWithMeta = this.getKeysWithMeta()

    // change the key on visibilty changes so the lines would update
    const key = keysWithMeta.map(k => `${k.visible}`).join(',') + (labels ? '-labels' : '') + (summed ? '-summed' : '')

    const { ticks, tickFormatter } = this.getTicks()

    // const ComposedChart = facets && summed ? AreaChart : LineChart

    const bars = true

    let xDomain = ['dataMin', 'dataMax']

    if (bars && graphData.length > 0) {
      xDomain = [
        moment(graphData[0].time).add(-0.5, timeGroup).valueOf(),
        moment(graphData[graphData.length - 1].time).add(0.5, timeGroup).valueOf()
      ]
    }

    return (
      <ResponsiveContainer width='100%' height={containerHeight}>
        <ComposedChart data={graphData}
                       key={key}
                       ref='lineChart'
                       margin={{top: 5, right: 10, left: 0, bottom: 5}}>
          <Legend verticalAlign='top'
                  align='right'
                  height={25}
                  iconSize={10}
                  wrapperStyle={{fontSize: 12, marginRight: -10}}
                  onClick={this.handleClick}
                  onMouseOver={this.handleMouseEnter}
                  onMouseOut={this.handleMouseLeave} />
          <XAxis type='number'
                 dataKey='time'
                 domain={xDomain}
                 tickFormatter={tickFormatter}
                 ticks={ticks} />
          <YAxis tickCount={Math.floor(containerHeight / 30)}
                 domain={percentages ? [0, 100] : ['auto', 'auto']}
                 interval={0}
                 tickFormatter={percentages ? (y) => `${Math.round(y)}%` : (y) => `${y.toLocaleString('en')}${unit}`}
                 allowDecimals={false} />
          <CartesianGrid />
          <Tooltip content={<CustomTooltip graph={graph} />} />
          {nullLineNeeded ? (
            <ReferenceLine y={0} stroke='red' alwaysShow />
          ) : null}
          {(facets ? keysWithMeta.reverse() : keysWithMeta).map(key => (
            bars ? <Bar {...this.getLineData(key, facets && summed)} />
                 : facets && summed ? <Area {...this.getLineData(key, facets && summed)} />
                                    : <Line {...this.getLineData(key, facets && summed)} />))}
        </ComposedChart>
      </ResponsiveContainer>
    )
  }
}
