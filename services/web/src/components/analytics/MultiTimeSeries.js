import React from 'react';
import { request } from 'utils/api';
import { Message } from 'semantic-ui-react';

export default class TimeSeries extends React.Component {
  state = {
    data: null,
    loading: true,
    error: null,
  };
  componentDidMount() {
    this.fetch();
  }

  fetch() {
    const { fetches } = this.props;
    //
    Promise.all(
      fetches.map((fetch) => {
        const { index, operation, interval, field, dateField, filter } = fetch;

        const body = {
          index,
          operation,
          interval,
          field,
          dateField,
          filter,
        };
        return request({
          method: 'POST',
          path: '/1/analytics/time-series',
          body,
        });
      })
    )
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
    return this.props.children(data);
  }
}
