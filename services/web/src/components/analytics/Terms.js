import React from 'react';
import request from 'utils/request';
import { Message } from 'semantic-ui-react';

export default class Terms extends React.Component {
  state = {
    data: null,
    loading: true,
    error: null
  };
  componentDidMount() {
    this.fetch();
  }

  fetch() {
    const {
      index,
      aggField,
      field,
      operation,
      filter,
      includeTopHit,
      referenceFetch,
      termsSize
    } = this.props;
    const body = {
      index,
      aggField,
      field,
      operation,
      filter,
      includeTopHit,
      referenceFetch,
      termsSize
    };
    request({
      method: 'POST',
      path: '/1/analytics/terms',
      body
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
    return this.props.children(data);
  }
}
