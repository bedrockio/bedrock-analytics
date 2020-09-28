import React from 'react';
import { Table } from 'semantic-ui-react';
import { numberWithCommas } from 'utils/formatting';

export default class VisualizationTable extends React.Component {
  render() {
    const {
      keyName,
      valueField,
      valueFieldName,
      data,
      keyFormatter,
      valueFormatter
    } = this.props;
    return (
      <Table celled>
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
                <Table.Cell>
                  {keyFormatter ? keyFormatter(item) : item.key}
                </Table.Cell>
                <Table.Cell>
                  {valueFormatter
                    ? valueFormatter(item)
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
