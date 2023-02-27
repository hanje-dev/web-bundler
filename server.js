const express = require('express');
const manifest = require('./build/manifest.json');

const app = express();

const htmlString = `<html>
  <body>
    Hello world
    <script src="/static/${manifest.bundle}"></script>
  </body>
</html>
`;

app.use('/static', express.static('./build'));
app.get('/', (req, res) => res.send(htmlString));
app.listen(8001, () => console.log('App listening on port 8001!'));
