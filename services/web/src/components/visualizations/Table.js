import React from 'react';
import { Table } from 'semantic-ui-react';
import { numberWithCommas } from 'utils/formatting';
import { startCase } from 'lodash';

export default class VisualizationTable extends React.Component {
  render() {
    const {
      keyField,
      keyName,
      valueField,
      valueFieldName,
      data,
      keyFormatter,
      valueFieldFormatter,
      collapsing,
      labels = {},
    } = this.props;
    const defaultKeyFormatter = (item) => {
      const key = keyField || 'key';
      const label = item[key];
      if (label.length <= 3) {
        return label.toUpperCase();
      }
      return labels[key] || startCase(label.toLowerCase());
    };

    return (
      <Table celled basic="very" collapsing={collapsing}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={10}>{keyName || 'Name'}</Table.HeaderCell>
            <Table.HeaderCell>{valueFieldName || 'Value'}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map((item) => {
            return (
              <Table.Row key={item.key}>
                <Table.Cell>{keyFormatter ? keyFormatter(item) : defaultKeyFormatter(item)}</Table.Cell>
                <Table.Cell>
                  {valueFieldFormatter
                    ? valueFieldFormatter(item[valueField || 'value'])
                    : numberWithCommas(Math.round(item[valueField || 'value']))}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    );
  }
}
