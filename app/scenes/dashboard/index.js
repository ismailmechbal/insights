import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './styles.scss'

// libraries
import React, { Component } from 'react'
import { connect } from 'kea/logic'
import { Responsive, WidthProvider } from 'react-grid-layout'
const ResponsiveReactGridLayout = WidthProvider(Responsive)
import { Layout } from 'react-flex-layout'

// utils

// components
import Graph from '~/scenes/dashboard/graph'
import Spinner from 'lib/tags/spinner'

// logic
import dashboardLogic from '~/scenes/dashboard/logic'

// const { SHOW_ALL, SHOW_ACTIVE, SHOW_COMPLETED } = dashboard.constants

@connect({
  actions: [
    dashboardLogic, [
      'layoutChanged',
      'selectDashboard',
      'addDashboard',
      'setCurrentBreakpoint',
      'saveDashboard',
      'undoDashboard',
      'startResizing',
      'stopResizing'
    ]
  ],
  props: [
    dashboardLogic, [
      'dashboards',
      'layouts',
      'layout',
      'items',
      'selectedDashboardId',
      'currentBreakpoint',
      'layoutsUnsaved',
      'savingDashboard',
      'resizingItem'
    ]
  ]
})
export default class Dashboard extends Component {
  state = {
    mounted: false
  }

  componentDidMount () {
    this.setState({ mounted: true })
  }

  generateDOM = () => {
    const { layout, items, resizingItem, selectedDashboardId } = this.props

    if (!layout) {
      return null
    }

    return layout.map(l => {
      return (
        <div key={l.i}>
          <Graph key={l.i}
                 itemId={l.i}
                 dashboardId={selectedDashboardId}
                 name={items[l.i].name}
                 path={items[l.i].path}
                 isResizing={l.i === resizingItem} />
        </div>
      )
    })
  }

  handleResizeStart = (layout, oldItem, newItem, placeholder, e, element) => {
    const { startResizing } = this.props.actions
    startResizing(oldItem.i)
  }

  handleResizeStop = (layout, oldItem, newItem, placeholder, e, element) => {
    const { stopResizing } = this.props.actions
    stopResizing(oldItem.i)
  }

  render () {
    const { layouts, dashboards, selectedDashboardId, layoutsUnsaved, savingDashboard } = this.props
    const { layoutChanged, selectDashboard, addDashboard, setCurrentBreakpoint, saveDashboard, undoDashboard } = this.props.actions
    const { mounted } = this.state

    return (
      <Layout className='dashboard-scene' ref={ref => { this._layout = ref }}>
        <Layout layoutHeight={50}>
          <div className='dashboards-list'>
            {Object.values(dashboards).map(dashboard => (
              <button key={dashboard.id} onClick={() => selectDashboard(dashboard.id)} className={selectedDashboardId === dashboard.id ? '' : 'white'}>{dashboard.name}</button>
            ))}
            <button className='white' onClick={() => addDashboard()}>+ ADD</button>
            {layoutsUnsaved ? (
              savingDashboard ? <Spinner />
                              : (
                                <div style={{display: 'inline-block'}}>
                                  <button className='fa fa-save' onClick={() => saveDashboard(selectedDashboardId)} />
                                  <button className='fa fa-undo' onClick={() => undoDashboard(selectedDashboardId)} />
                                </div>
                              )
            ) : null}
          </div>
        </Layout>
        <Layout layoutHeight='flex'>
          <ResponsiveReactGridLayout className='layout'
                                     breakpoints={{desktop: 768, mobile: 0}}
                                     cols={{desktop: 6, mobile: 2}}
                                     rowHeight={30}
                                     layouts={layouts}
                                     onLayoutChange={layoutChanged}
                                     onBreakpointChange={setCurrentBreakpoint}
                                     onResizeStart={this.handleResizeStart}
                                     onResizeStop={this.handleResizeStop}
                                     // WidthProvider option
                                     useCSSTransforms={mounted}
                                     measureBeforeMount>
            {this.generateDOM()}
          </ResponsiveReactGridLayout>
        </Layout>
      </Layout>
    )
  }
}
