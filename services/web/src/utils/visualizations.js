import moment from 'moment';

export const formatterForDataCadence = (data) => {
  if (!data.length || !data[1]) return (unixTime) => moment(unixTime).format('MM/DD');
  const delta = data[1].timestamp - data[0].timestamp;
  const range = data[data.length - 1].timestamp - data[0].timestamp;
  if (range > 356 * 24 * 3600 * 1000) {
    return (unixTime) => moment(unixTime).format('YYYY/MM/DD');
  } else if (delta > 5 * 3600 * 1000) {
    return (unixTime) => moment(unixTime).format('MM/DD');
  } else {
    return (unixTime) => moment(unixTime).format('LT');
  }
};

export const defaultColors = ['#2185d0', '#00b5ad', '#21ba45', '#b5cc18', '#fbbd08', '#f2711c'];
