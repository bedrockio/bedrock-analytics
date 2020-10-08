import React, { PureComponent } from 'react';
import { AutoSizer } from 'react-virtualized';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { startCase } from 'lodash';
import { numberWithCommas } from 'utils/formatting';
import { defaultColors } from 'utils/visualizations';

export default class DonutChart extends PureComponent {
  render() {
    const { data, keyField, keyFormatter, valueField, limit, percent, precision, labels = {} } = this.props;
    let trimmedData = data;
    if (limit) {
      const other = { key: 'Other', count: 0, value: 0 };
      data.slice(limit - 1).forEach((item) => {
        other.count += item.count;
        other.value += item.value;
      });
      trimmedData = data.slice(0, limit - 1);
      if (data.length > limit) {
        trimmedData.push(other);
      }
    }
    let total = 0;
    data.forEach((item) => {
      total += item[valueField || 'count'];
    });
    const colors = this.props.colors || defaultColors;
    const colorFn = this.props.colorFn;
    const defaultKeyFormatter = (item) => {
      const key = keyField || 'key';
      const label = item[key];
      if (label.length <= 3) {
        return label.toUpperCase();
      }
      return labels[key] || startCase(label.toLowerCase());
    };

    return (
      <AutoSizer disableHeight>
        {({ width }) => {
          if (!width) {
            return <div />;
          }
          const height = 400;
          return (
            <PieChart width={width} height={height} data={trimmedData}>
              <Pie
                data={trimmedData}
                cx={Math.round(width / 2)}
                cy={Math.round(height / 2) - 20}
                innerRadius={Math.round(height * 0.2)}
                outerRadius={Math.round(height * 0.36)}
                fill="#8884d8"
                paddingAngle={5}
                nameKey={keyFormatter || defaultKeyFormatter}
                dataKey={valueField || 'count'}>
                {trimmedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colorFn ? colorFn(entry, index) : colors[index % colors.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip
                formatter={(value) => {
                  if (percent) {
                    if (precision) {
                      return `${Math.round((value / total) * (10 * precision) * 100) / (10 * precision)}%`;
                    } else {
                      return `${Math.round((value / total) * 100)}%`;
                    }
                  }
                  return numberWithCommas(value);
                }}
              />
            </PieChart>
          );
        }}
      </AutoSizer>
    );
  }
}
