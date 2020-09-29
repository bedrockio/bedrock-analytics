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

const fuse = (series, valueField) => {
  const byTs = {};
  series[0].forEach((item) => {
    byTs[item.timestamp] = {};
  });
  series.forEach((serie, index) => {
    serie.forEach((item) => {
      if (!byTs[item.timestamp]) {
        byTs[item.timestamp] = {};
      }
      byTs[item.timestamp][`${index}-value`] = item[valueField || 'value'] || 0;
    });
  });
  return series[0].map((item) => {
    return {
      timestamp: item.timestamp,
      ...byTs[item.timestamp],
    };
  });
};

export default class MultiSeriesChart extends PureComponent {
  render() {
    const { data, valueField, valueFieldNames, legend, area, bar, stacked, colors, disableDot } = this.props;
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
    const fusedData = fuse(data, valueField);
    const finalColors = colors || defaultColors;
    const tickFormatter = formatterForDataCadence(data[0]);
    return (
      <AutoSizer disableHeight>
        {({ width }) => {
          if (!width) {
            return <div />;
          }
          return (
            <Chart
              width={width}
              height={400}
              data={fusedData}
              margin={{
                top: 5,
                right: 20,
                left: 10,
                bottom: 5,
              }}>
              <CartesianGrid vertical={false} stroke="#EEF0F4" />
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
                tickFormatter={(value) => numberWithCommas(value)}
                tick={{ fill: '#6C767B', fontSize: '13' }}
                tickLine={{ fill: '#6C767B' }}
                tickMargin={8}
              />
              {legend && <Legend iconType="circle" />}
              {data.map((data, index) => {
                const color = finalColors[index % finalColors.length];
                return (
                  <ChartGraph
                    type="monotone"
                    dataKey={`${index}-value`}
                    name={valueFieldNames ? valueFieldNames[index] : 'Value'}
                    stroke={color}
                    fill={area || bar ? color : undefined}
                    fillOpacity={1}
                    opacity={area || bar ? 1 : 1}
                    activeDot={disableDot ? { r: 0 } : { r: 6 }}
                    stackId={stacked ? '1' : undefined}
                  />
                );
              })}
              {!bar && (
                <Tooltip
                  formatter={(value) => numberWithCommas(Math.round(value))}
                  labelFormatter={(unixTime) => moment(unixTime).format('YY/MM/DD LT')}
                />
              )}
            </Chart>
          );
        }}
      </AutoSizer>
    );
  }
}
