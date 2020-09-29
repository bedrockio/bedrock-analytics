import React from 'react';
import { request } from 'utils/api';
import { Message, Table, Label } from 'semantic-ui-react';

function formatStatus(item) {
  if (item.elasticsearch.count === item.mongodbCount) {
    return <Label content="In Sync" color="olive" />;
  }
  if (item.elasticsearch.count < item.mongodbCount) {
    return <Label content="Behind" />;
  }
  return <Label content="Irregular" color="yellow" />;
}

export default class MongodbStatus extends React.Component {
  state = {
    data: null,
    loading: true,
    error: null,
  };
  componentDidMount() {
    this.fetch();
  }

  fetch() {
    const { index, fields, filter } = this.props;
    const body = {
      index,
      fields,
      filter,
    };
    request({
      method: 'POST',
      path: '/1/analytics/mongodb-status',
      body,
    })
      .then((data) => {
        this.setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        this.setState({ error, loading: false });
      });
  }

  render() {
    const { loading, error, data } = this.state;
    if (loading) return <p>loading</p>;
    if (error) return <Message error content={error.message} />;
    return (
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>ES Index</Table.HeaderCell>
            <Table.HeaderCell>MongoDB Collection</Table.HeaderCell>
            <Table.HeaderCell>ES Disk Size</Table.HeaderCell>
            <Table.HeaderCell>ES Count</Table.HeaderCell>
            <Table.HeaderCell>MongoDB Count</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Object.keys(data).map((index) => {
            const item = data[index];
            return (
              <Table.Row key={index}>
                <Table.Cell>{index}</Table.Cell>
                <Table.Cell>{item.mongodb.collectionName}</Table.Cell>
                <Table.Cell>{item.elasticsearch.diskSize}</Table.Cell>
                <Table.Cell>{item.elasticsearch.count}</Table.Cell>
                <Table.Cell>{item.mongodbCount}</Table.Cell>
                <Table.Cell>{formatStatus(item)}</Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    );
  }
}
