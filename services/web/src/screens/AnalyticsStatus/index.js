import React from 'react';
import { screen } from 'helpers';

import TimeSeries from 'components/analytics/TimeSeries';
import SeriesChart from 'components/visualizations/SeriesChart';
import MultiCardinality from 'components/analytics/MultiCardinality';
import { numberWithCommas } from 'utils/formatting';
import MongodbStatus from './MongodbStatus';

import { Divider, Segment, Header, Statistic, Table, Message, Button } from 'semantic-ui-react';

@screen
export default class AnalyticsStatus extends React.Component {
  render() {
    return (
      <div>
        <Header as="h2">Analytics Status</Header>
        <Segment>
          <Divider hidden />
          <MultiCardinality
            fetches={[
              {
                index: 'mongodb-users',
                fields: ['id'],
              },
              {
                index: 'mongodb-shops',
                fields: ['id'],
              },
              {
                index: 'mongodb-products',
                fields: ['id'],
              },
            ]}>
            {(data) => {
              return (
                <Statistic.Group widths="three">
                  <Statistic>
                    <Statistic.Value>{numberWithCommas(data[0]['id'])}</Statistic.Value>
                    <Statistic.Label>Users</Statistic.Label>
                  </Statistic>
                  <Statistic>
                    <Statistic.Value>{numberWithCommas(data[1]['id'])}</Statistic.Value>
                    <Statistic.Label>Shops</Statistic.Label>
                  </Statistic>
                  <Statistic>
                    <Statistic.Value>{numberWithCommas(data[2]['id'])}</Statistic.Value>
                    <Statistic.Label>Products</Statistic.Label>
                  </Statistic>
                </Statistic.Group>
              );
            }}
          </MultiCardinality>
          <Divider hidden />
          <Header as="h4" content="Products over Time" textAlign="center" />
          <TimeSeries index="mongodb-products" operation="count" interval="1d">
            {(data) => {
              return <SeriesChart data={data} height={200} bar valueField="count" />;
            }}
          </TimeSeries>
        </Segment>

        <Header as="h3" content="Indexing Status" />
        <p>Below is the current status of the auto Elasticsearch indexing of MongoDB data.</p>
        <MongodbStatus />
      </div>
    );
  }
}
