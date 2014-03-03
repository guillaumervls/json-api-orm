JSON-API ORM [![build status](https://secure.travis-ci.org/guillaumervls/json-api-orm.png)](http://travis-ci.org/guillaumervls/json-api-orm)
============

*Easily create an [API that serves JSON](http://jsonapi.org/format)*

### Why ?
Because it doesn't depend on a specific database.
Because it supports the fetching of related documents in a single DB query.
(See "Compound Documents" section in [JSON API spec](http://jsonapi.org/format))

# Install
`npm install json-api-orm --save`

# Use

## 1. Setup your backend database

Pass `queryCreate`, `queryRead`, `queryUpdate`, `queryDelete` functions.
They should return a query object that will then be passed to the `exec` function. They are call in the context of the type of object to be processed.

You also pass an `exec` function to execute queries.

So the query object structure is totally up to you (and your DB system) !

```javascript
var orm = require('json-api-orm'); // (BTW: orm === orm.setupBackend(...) is true)
orm.setupBackend({
  queryCreate: function (object /*object to create*/) {
    return query;
  },
  queryRead: function (ids /*array of ids of objects to retrieve*/) {
    return query;
  },
  queryUpdate: function (patch /*patch to apply*/) {
    return query;
  },
  queryDelete: function (id /*id of object to delete*/) {
    return query;
  },
  exec: function (query, callback) {
    callback(null, result);
  }
});
```

# Test
`npm test`

# Licence

```
The MIT License (MIT)

Copyright (c) 2014 guillaumervls

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

```