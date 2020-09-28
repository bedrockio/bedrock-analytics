const {
  terms,
  timeSeries,
  search,
  get,
  fetch,
  indexEvent,
  loadJsonStreamFile,
  refreshIndex,
  stats,
  cardinality,
  ensureIndex,
} = require("./../analytics");

const testIndex = "bedrock-analytics-test";

jest.setTimeout(20 * 1000);

const indexEvents = async () => {
  const events = loadJsonStreamFile(
    __dirname + "/fixtures/analytics/performance-member-summary.jsons"
  );
  await ensureIndex(testIndex, { recreate: true });
  let i = 0;
  for (const event of events) {
    event.timestamp = Date.parse(event["date-created"]);
    if (i === 0) {
      event.deletedAt = new Date();
    }
    if (i < 5) {
      event.isFirstFive = true;
    }
    await indexEvent(testIndex, event);
    i += 1;
  }
  await refreshIndex(testIndex);
};

beforeAll(async () => {
  await indexEvents(testIndex);
});

describe("analytics", () => {
  it("should allow term aggregations (top lists)", async () => {
    const result = await terms(testIndex, "class-info.class-type");
    expect(result).toEqual([
      {
        key: "Orange 60",
        count: 159,
        value: 0,
      },
      {
        key: "Orange 60 Minute",
        count: 70,
        value: 0,
      },
      {
        key: "Orange 3G",
        count: 41,
        value: 0,
      },
    ]);
  });
  it("should allow term aggregations (top lists with values)", async () => {
    const result = await terms(testIndex, "class-info.class-type", {
      field: "zone-info.red-zone-time",
      operation: "avg",
    });
    expect(result).toEqual([
      { key: "Orange 3G", count: 41, value: 881.780487804878 },
      { key: "Orange 60", count: 159, value: 805.9685534591194 },
      { key: "Orange 60 Minute", count: 70, value: 657 },
    ]);
  });
  it("should allow term aggregations (top lists with values and top hit)", async () => {
    const result = await terms(testIndex, "class-info.class-type", {
      field: "zone-info.red-zone-time",
      operation: "avg",
      includeTopHit: true,
    });
    expect(result[0].topHit._id).toEqual(
      "37d2aa7b-64a9-4e02-8980-504ad3f20a61"
    );
    expect(result[0].topHit._source.id).toEqual(
      "37d2aa7b-64a9-4e02-8980-504ad3f20a61"
    );
  });
  it("should allow term aggregations with a reference fetch", async () => {
    const result = await terms(testIndex, "class-info.class-type", {
      field: "zone-info.red-zone-time",
      operation: "avg",
      referenceFetch: {
        sourceField: "id",
        destinationField: "id",
        destinationIndex: testIndex,
      },
    });
    expect(result[0].topHit._id).toEqual(
      "37d2aa7b-64a9-4e02-8980-504ad3f20a61"
    );
    expect(result[0].topHit._source.id).toEqual(
      "37d2aa7b-64a9-4e02-8980-504ad3f20a61"
    );
    expect(result[0].reference.id).toEqual(
      "37d2aa7b-64a9-4e02-8980-504ad3f20a61"
    );
  });
  it.skip("should allow time series aggregations (count)", async () => {
    const result = await timeSeries(testIndex, "count", null, {
      interval: "10s",
    });
    expect(result.length).toBe(7);
    const [bucket] = result;
    expect(bucket.count).toBe(42);
    expect(!!bucket.timestamp).toBe(true);
  });
  it.skip("should allow time series aggregations (sum)", async () => {
    const result = await timeSeries(
      testIndex,
      "sum",
      "zone-info.red-zone-time",
      { interval: "10s" }
    );
    expect(result.length).toBe(7);
    const [bucket] = result;
    expect(bucket.count).toBe(42);
    expect(bucket.value).toBe(33876);
    expect(!!bucket.timestamp).toBe(true);
  });
  it.skip("should allow time series aggregations (max)", async () => {
    const result = await timeSeries(testIndex, "max", "otbeat-info.max-hr", {
      interval: "20s",
    });
    expect(result.length).toBe(4);
    const [bucket] = result;
    expect(bucket.count).toBe(42);
    expect(bucket.value).toBe(240);
    expect(!!bucket.timestamp).toBe(true);
  });
  it("should allow a stats of fields", async () => {
    const result = await stats(testIndex, ["treadmill-summary.total-distance"]);
    expect(result).toEqual({
      "treadmill-summary.total-distance": {
        count: 270,
        min: 0,
        max: 7681,
        avg: 1130.5296296296297,
        sum: 305243,
      },
    });
  });
  it("should allow a cardinality of fields", async () => {
    const result = await cardinality(testIndex, ["member-info.member-uuid"]);
    expect(result).toEqual({
      "member-info.member-uuid": 270,
    });
  });
  it("should allow search of all events", async () => {
    const { hits } = await search(testIndex);
    expect(hits.total.value).toBe(270);
    expect(hits.hits.length).toBe(100);
    const [event] = hits.hits;
    expect(event._id).toBe("b5eff187-6640-48d5-9f76-adfc5d416b7c");
  });
  it("should allow search of events and filter", async () => {
    const { hits } = await search(testIndex, {
      terms: [{ "member-info.member-firstname": "BRITTANYB2" }],
    });
    expect(hits.total.value).toBe(1);
    expect(hits.hits.length).toBe(1);
    const [event] = hits.hits;
    expect(event._id).toBe("bc20f8b0-f2b4-4278-b7ba-17cde5e9485e");
  });
  it("should allow search of events and filter by field existing", async () => {
    const { hits } = await search(testIndex, { notExists: "deletedAt" });
    expect(hits.total.value).toBe(269);
  });
  it("should allow search of events and filter by boolean", async () => {
    const { hits } = await search(testIndex, {
      terms: [{ isFirstFive: true }],
    });
    expect(hits.total.value).toBe(5);
  });
  it("should allow getting of event by id", async () => {
    const event = await get(testIndex, "bc20f8b0-f2b4-4278-b7ba-17cde5e9485e");
    expect(event._id).toBe("bc20f8b0-f2b4-4278-b7ba-17cde5e9485e");
  });
  it("should fetch an event by field and value", async () => {
    const event = await fetch(
      testIndex,
      "member-info.member-uuid",
      "78b7257a-49bb-48ae-a1d1-0252f9430e1f"
    );
    expect(event["member-info"]["member-uuid"]).toBe(
      "78b7257a-49bb-48ae-a1d1-0252f9430e1f"
    );
  });
});
