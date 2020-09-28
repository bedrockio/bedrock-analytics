import React from 'react';
import request from 'utils/request';
import { Message } from 'semantic-ui-react';

export default class MultiStats extends React.Component {
  state = {
    data: null,
    loading: true,
    error: null
  };
  componentDidMount() {
    this.fetch();
  }

  fetch() {
    const { fetches } = this.props;
    Promise.all(
      fetches.map((fetch) => {
        const { index, filter, fields } = fetch;

        const body = {
          index,
          fields,
          filter
        };
        return request({
          method: 'POST',
          path: '/1/analytics/cardinality',
          body
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
