# Document Generator Serivce

## Creating A document Example:

make a POST request to :
\${service}/jsonDocument/create

## Request Body :

### Body:

```
{
  "projectName": "devops",
  "templateFile": "/templates/SRS.",
  "contentControls": [
    {
      "title": "required-states-and-modes",
      "skin": "table",
      "headingLevel": "3",
      "data": {
        "type": "query",
        "queryId": "64f6d036-8b23-41ba-af98-fe8b93de1258"
      }
    }
  ]
}
```

### Content Controls:

#### Query based

- "title" - title of the dotx content control placeholder

- "skin" - skin type:
  - table
  - paragraph
- "data" - this section refers to data source for the skin
  - "type" - type of source could be:
    - "query" - for query based
  - "queryId" - if the type is query then needs to specify query id

* headingLevel - the level of heading in which the root will begin

##### Example:

```
    {
      "title": "required-states-and-modes",
      "skin": "table",
      "headingLevel": "3",
      "data": {
        "type": "query",
        "queryId": "64f6d036-8b23-41ba-af98-fe8b93de1258"
      }
    }
```

#### Test based

- "title" - title of the dotx content control placeholder

- "skin" - skin type:
  - test-std
- "data" - this section refers to data source for the skin
  - "type" - type of source could be:
    - "test" - for test based
  - "planId" - if the type is test based then needs to specify test plan id
  - "specificSuitesId" - **OPTIONAL** - if intrested in only specific test suites need to specify ids inside an array

* headingLevel - the level of heading in which the root will begin

##### Example:

```

{
"title": "required-states-and-modes",
"skin": "test-std",
"headingLevel": "3",
"data": {
"type": "test",
"planId": "148"
"specificSuitesId":[35,48,125]
}
}

```

#### Trace Table

this content control can be test based or query based.

- "title" - title of the dotx content control placeholder
- "skin" - skin type:
  - trace-table
- "data" - this section refers to data source for the skin
  - "type" - type of source could be:
    - "test" - for test based
    - "query" - for test based
  - "planId" - if the type is test based then needs to specify test plan id
  - "queryId" - if query based
  - "specificSuitesId" - **OPTIONAL** - if intrested in only specific test suites need to specify ids inside an array

* headingLevel - the level of heading in which the root will begin

##### Example:

```

{
  "teamProjectName": "devops",
  "templateFile": "",
  "contentControls": [
    {
      "title": "trace-query",
      "skin": "trace-table",
      "headingLevel": 5,
      "data": {
        "type": "query",
        "queryId": "1d9333bb-a300-4443-b519-867e98624a87"
      }
    },
    {
      "title": "trace-test",
      "skin": "trace-table",
      "headingLevel": 6,
      "data": { "type": "test", "planId": 141 }
    }
  ],
  "collectionName": "testcollection"
}


```

the end!
