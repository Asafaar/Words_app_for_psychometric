const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const cors = require('cors');
const path = require('path'); // Add this line


const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors()); // enable CORS for all routes
app.use(express.json());

app.get('/redfix.xlsx', (req, res) => {
const filePath = `${__dirname}/uploads/redfix.xlsx`;

  res.sendFile(filePath);

});
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const extname = path.extname(file.originalname);
  if (extname === '.xlsx') {
    const oldPath = `uploads/redfix${extname}`;
    const newPath = path.join(path.dirname(oldPath), path.basename(oldPath, path.extname(oldPath)) + extname);

    fs.unlink(oldPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error(err);
        res.status(500).send('Error deleting file');
      } else {
        fs.rename(file.path, newPath, (err) => {
          if (err) {
            console.error(err);
            res.status(500).send('Error saving file');
          } else {
            console.log('File uploaded successfully');
            res.send('File uploaded successfully');
          }
        });
      }
    });
  } else {
    console.log('Invalid file type');
    res.status(400).send('Invalid file type');
  }
});
const WordNet = require("node-wordnet")
const wordnet = new WordNet("./node_modules/wordnet-db/dict")


 app.get('/word', (req, res)  =>{
  console.log(req.query.word)
  const word= req.query.word;
  const examplesWithWord = [];
   wordnet.lookup(word, function(err, results) {
    if (err) {
      console.error(err);
      return;
    }
    console.log(results)
   
  
    results.forEach(function(result) {
      result.exp.forEach(function(example) {
        // console.log(example)
        if (example.includes(word)) {
          console.log(example)
          examplesWithWord.push(example);
          console.log(examplesWithWord)
        }
      });
  
      // console.log(JSON.stringify(result, null, 2))
    })
    res.send({ examples: examplesWithWord });

  })
  // console.log(examplesWithWord)
  // res.send({ examples: examplesWithWord });

});
// app.post('/redfix', upload.single('file'), (req, res) => {
//   const file = req.file;
//   if (!file) {
//     res.status(400).send('No file uploaded');
//     return;
//   }
//   fs.rename(file.path, 'redfix.xlsx', (err) => {
//     if (err) {
//       console.error(err);
//       res.status(500).send('Internal server error');
//     } else {
//       res.send('File uploaded successfully');
//     }
//   });
// });

app.listen(3001, () => {
  console.log('Server listening on port 3000');
});