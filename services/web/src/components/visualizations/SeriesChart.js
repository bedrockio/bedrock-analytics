import React, { PureComponent } from 'react';
import { AutoSizer } from 'react-virtualized';
import { numberWithCommas } from 'utils/formatting';
import { formatterForDataCadence } from 'utils/visualizations';
import {
  AreaChart,
  LineChart,
  BarChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import moment from 'moment';
import { defaultColors } from 'utils/visualizations';

export default class SeriesChart extends PureComponent {
  render() {
    const {
      height,
      data,
      valueField,
      valueFieldName,
      valueFieldFormatter,
      legend,
      area,
      bar,
      disableDot,
      color = defaultColors[0],
    } = this.props;
    let Chart = LineChart;
    let ChartGraph = Line;
    if (area) {
      Chart = AreaChart;
      ChartGraph = Area;
    }
    if (bar) {
      Chart = BarChart;
      ChartGraph = Bar;
    }
    const tickFormatter = formatterForDataCadence(data);
    const defaultValueFieldFormatter = (value) => numberWithCommas(value);
    return (
      <AutoSizer disableHeight>
        {({ width }) => {
          if (!width) {
            return <div />;
          }
          return (
            <Chart
              width={width}
              height={height || 400}
              data={data}
              margin={{
                top: 5,
                right: 20,
                left: 25,
                bottom: 5,
              }}>
              <XAxis
                dataKey="timestamp"
                name="Time"
                tickFormatter={tickFormatter}
                tick={{ fill: '#6C767B', fontSize: '13' }}
                tickLine={{ stroke: '#6C767B' }}
                axisLine={{ stroke: '#6C767B' }}
                tickMargin={8}
              />
              <YAxis
                tickFormatter={valueFieldFormatter || defaultValueFieldFormatter}
                tick={{ fill: '#6C767B', fontSize: '13' }}
                tickLine={{ fill: '#6C767B' }}
                tickMargin={8}
              />
              {!bar && <Tooltip labelFormatter={(unixTime) => moment(unixTime).format('YY/MM/DD LT')} />}
              {legend && <Legend />}
              <ChartGraph
                type="monotone"
                dataKey={valueField || 'value'}
                name={valueFieldName || 'Value'}
                stroke={color}
                strokeWidth={2}
                fill={area || bar ? color : undefined}
                opacity={bar ? 1 : 1}
                activeDot={disableDot ? { r: 0 } : { r: 6, strokeWidth: 2, fill: '#f5821f' }}
                dot={{
                  stroke: color,
                  strokeWidth: 2,
                  strokeOpacity: 1,
                  r: 4,
                  fill: '#fff',
                }}
                barSize={30}
              />
            </Chart>
          );
        }}
      </AutoSizer>
    );
  }
}
