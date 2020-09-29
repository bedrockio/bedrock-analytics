import React from 'react';
import { request } from 'utils/api';
import { Message } from 'semantic-ui-react';

const hasDifferentParams = (oldProps, newProps) => {
  if (oldProps.interval !== newProps.interval) {
    return true;
  }
  if (JSON.stringify(oldProps.filter) !== JSON.stringify(newProps.filter)) {
    return true;
  }
  return false;
};

export default class TimeSeries extends React.Component {
  state = {
    data: null,
    loading: true,
    error: null,
  };

  componentDidMount() {
    this.fetch(this.props);
  }

  componentWillReceiveProps(props) {
    if (hasDifferentParams(this.props, props)) {
      this.fetch(props);
    }
  }

  fetch({ interval, filter }) {
    const { index, operation, field, dateField } = this.props;
    const body = {
      index,
      operation,
      interval,
      field,
      dateField,
      filter,
    };
    request({
      method: 'POST',
      path: '/1/analytics/time-series',
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
    return this.props.children(data);
  }
}
